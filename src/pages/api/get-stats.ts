import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    const REPO_OWNER = import.meta.env.PUBLIC_REPO_OWNER || "trueberryless";
    const REPO_NAME =
      import.meta.env.PUBLIC_REPO_NAME || "correlation-vs-causation-quiz";

    if (!GITHUB_TOKEN) {
      // Fallback to empty stats
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get all files in results folder
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/results`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const files = await response.json();
    const allResults = [];

    // Fetch each file's content
    for (const file of files) {
      if (file.type === "file" && file.name.endsWith(".json")) {
        try {
          const fileResponse = await fetch(file.download_url);
          if (fileResponse.ok) {
            const data = await fileResponse.json();
            allResults.push(...data);
          }
        } catch (error) {
          console.error(`Error fetching ${file.name}:`, error);
        }
      }
    }

    return new Response(JSON.stringify(allResults), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
