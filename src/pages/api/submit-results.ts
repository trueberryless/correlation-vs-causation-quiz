import type { APIRoute } from "astro";
import { nanoid } from "nanoid";

export const POST: APIRoute = async ({ request }) => {
  try {
    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    const REPO_OWNER = import.meta.env.PUBLIC_REPO_OWNER || "trueberryless";
    const REPO_NAME =
      import.meta.env.PUBLIC_REPO_NAME || "correlation-vs-causation-quiz";

    if (!GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GitHub token not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate and parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.results || !Array.isArray(body.results)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate results structure
    for (const result of body.results) {
      if (
        typeof result.correct !== "number" ||
        typeof result.total !== "number" ||
        typeof result.avgConfidence !== "number"
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid result structure",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    const userId = body.userId;
    const fileName = `results/${userId}.json`;

    try {
      // Try to get existing file
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );

      let existingData = [];
      let sha = null;

      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha;
        const content = Buffer.from(fileData.content, "base64").toString(
          "utf-8",
        );
        existingData = JSON.parse(content);
      }

      // Append new results
      const updatedData = [...existingData, ...body.results];

      // Create branch name
      const branchName = `results-${userId}-${Date.now()}`;

      // Get main branch SHA
      const mainBranchResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );

      if (!mainBranchResponse.ok) {
        throw new Error("Failed to get main branch");
      }

      const mainData = await mainBranchResponse.json();
      const mainSha = mainData.object.sha;

      // Create new branch
      const createBranchResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: mainSha,
          }),
        },
      );

      if (!createBranchResponse.ok) {
        throw new Error("Failed to create branch");
      }

      // Update/create file in new branch
      const content = Buffer.from(
        JSON.stringify(updatedData, null, 2),
      ).toString("base64");

      const updateFileResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            message: `Add quiz results for user ${userId.slice(0, 8)}`,
            content: content,
            branch: branchName,
            ...(sha && { sha }),
          }),
        },
      );

      if (!updateFileResponse.ok) {
        const errorData = await updateFileResponse.json();
        console.error("GitHub API Error:", errorData);
        throw new Error("Failed to update file");
      }

      // Create PR
      const latestResult = body.results[body.results.length - 1];
      const createPRResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            title: `Quiz Results: ${latestResult.correct}/${latestResult.total} correct (${latestResult.percentage.toFixed(1)}%)`,
            body: `Automated quiz result submission\n\nUser: ${userId.slice(0, 8)}...\nScore: ${latestResult.correct}/${latestResult.total}\nAverage Confidence: ${latestResult.avgConfidence.toFixed(1)}%\nEstimate: ${latestResult.estimate}`,
            head: branchName,
            base: "main",
          }),
        },
      );

      if (!createPRResponse.ok) {
        const errorData = await createPRResponse.json();
        console.error("Failed to create PR:", errorData);
        // Don't throw here - file was still updated
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Results submitted successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("GitHub operation error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to submit to GitHub",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
