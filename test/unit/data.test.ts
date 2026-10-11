import { describe, expect, test } from 'vitest'

import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'
import { questions } from '../../shared/questions'

describe('questions', () => {
  test('have unique ids', () => {
    const ids = questions.map(({ id }) => id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  test('are written in both languages', () => {
    for (const { explanation, id, statement } of questions) {
      expect(statement.en.trim(), `statement of ${id}`).not.toBe('')
      expect(statement.de.trim(), `german statement of ${id}`).not.toBe('')
      expect(explanation.en.trim(), `explanation of ${id}`).not.toBe('')
      expect(explanation.de.trim(), `german explanation of ${id}`).not.toBe('')
    }
  })

  test('link to valid sources', () => {
    for (const { id, source_url } of questions) {
      if (source_url) {
        expect(() => new URL(source_url), `source of ${id}`).not.toThrow()
        expect(new URL(source_url).protocol, `source of ${id}`).toBe('https:')
      }
    }
  })

  test('offer enough causal and correlation questions for a quiz', () => {
    expect(questions.filter(({ is_causal }) => is_causal).length).toBeGreaterThanOrEqual(5)
    expect(questions.filter(({ is_causal }) => !is_causal).length).toBeGreaterThanOrEqual(5)
  })
})

describe('translations', () => {
  test('have the same keys in every language', () => {
    expect(Object.keys(de).toSorted()).toEqual(Object.keys(en).toSorted())
  })

  test('use the same placeholders in every language', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(([, name]) => name).toSorted()

    for (const [key, text] of Object.entries(en)) {
      expect(placeholders((de as Record<string, string>)[key]!), key).toEqual(placeholders(text))
    }
  })

  test('are never empty', () => {
    for (const messages of [en, de]) {
      for (const [key, text] of Object.entries(messages)) {
        expect(text.trim(), key).not.toBe('')
      }
    }
  })
})
