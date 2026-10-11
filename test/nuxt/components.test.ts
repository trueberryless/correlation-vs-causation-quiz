import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

import QuizEstimate from '../../app/components/QuizEstimate.vue'
import QuizIntro from '../../app/components/QuizIntro.vue'
import QuizQuestion from '../../app/components/QuizQuestion.vue'
import QuizResults from '../../app/components/QuizResults.vue'
import { questions } from '../../shared/questions'

const question = questions[0]!
const result = {
  answers: [],
  avgConfidence: 82.5,
  correct: 7,
  estimate: 6,
  percentage: 70,
  timestamp: '2026-06-05T15:17:50.272Z',
  total: 10,
}

describe('QuizIntro', () => {
  it('shows the remaining attempts and starts the quiz', async () => {
    const wrapper = await mountSuspended(QuizIntro, { props: { attemptsLeft: 3 } })

    expect(wrapper.get('[data-testid="attempts-left"]').text()).toBe('Attempts left: 3')

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('start')).toHaveLength(1)
  })

  it('uses the singular for a single attempt', async () => {
    const wrapper = await mountSuspended(QuizIntro, { props: { attemptsLeft: 1 } })

    expect(wrapper.get('[data-testid="attempts-left"]').text()).toBe('Attempt left: 1')
  })

  it('disables the start without attempts', async () => {
    const wrapper = await mountSuspended(QuizIntro, { props: { attemptsLeft: 0 } })

    expect(wrapper.get('[data-testid="attempts-left"]').text()).toBe('No attempts left')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})

describe('QuizQuestion', () => {
  it('asks to adjust the confidence before the first answer', async () => {
    const wrapper = await mountSuspended(QuizQuestion, { props: { current: 1, question, total: 10 } })

    await wrapper.get('[data-testid="answer-causal"]').trigger('click')

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.emitted('answer')).toBeUndefined()
  })

  it('emits the answer with the confidence after the slider moved', async () => {
    const wrapper = await mountSuspended(QuizQuestion, { props: { current: 2, question, total: 10 } })

    await wrapper.get('#confidence').setValue(90)
    await wrapper.get('[data-testid="answer-correlation"]').trigger('click')

    expect(wrapper.emitted('answer')).toEqual([[false, 90]])
  })

  it('shows the progress and the statement', async () => {
    const wrapper = await mountSuspended(QuizQuestion, { props: { current: 4, question, total: 10 } })

    expect(wrapper.get('[data-testid="progress"]').text()).toBe('Question 4 of 10')
    expect(wrapper.get('[data-testid="statement"]').text()).toBe(question.statement.en)
  })

  it('resets the confidence for the next question', async () => {
    const wrapper = await mountSuspended(QuizQuestion, { props: { current: 1, question, total: 10 } })

    await wrapper.get('#confidence').setValue(90)
    await wrapper.setProps({ current: 2, question: questions[1]! })

    expect((wrapper.get('#confidence').element as HTMLInputElement).value).toBe('50')
    expect(wrapper.find('#confidence-hint').exists()).toBe(true)
  })
})

describe('QuizEstimate', () => {
  it('changes the estimate by one', async () => {
    const wrapper = await mountSuspended(QuizEstimate, { props: { isSubmitting: false, modelValue: 5, total: 10 } })

    await wrapper.get('button[aria-label="Increase"]').trigger('click')
    await wrapper.get('button[aria-label="Decrease"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[6], [5]])
  })

  it('keeps the estimate between zero and the number of questions', async () => {
    const wrapper = await mountSuspended(QuizEstimate, { props: { isSubmitting: false, modelValue: 10, total: 10 } })

    await wrapper.get('button[aria-label="Increase"]').trigger('click')
    await wrapper.get('input').setValue('99')

    expect(wrapper.emitted('update:modelValue')?.flat() ?? []).not.toContain(11)
    expect(wrapper.emitted('update:modelValue')?.flat() ?? []).not.toContain(99)

    await wrapper.setProps({ modelValue: 0 })
    await wrapper.get('button[aria-label="Decrease"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.flat() ?? []).not.toContain(-1)
  })

  it('submits and shows the progress', async () => {
    const wrapper = await mountSuspended(QuizEstimate, { props: { isSubmitting: false, modelValue: 5, total: 10 } })

    await wrapper.findAll('button').at(-1)!.trigger('click')

    expect(wrapper.emitted('submit')).toHaveLength(1)

    await wrapper.setProps({ isSubmitting: true })

    expect(wrapper.text()).toContain('Submitting your results...')
  })
})

describe('QuizResults', () => {
  it('shows the score, the confidence and the estimate', async () => {
    const wrapper = await mountSuspended(QuizResults, {
      props: { attemptsLeft: 2, hasSubmissionFailed: false, result },
    })
    const text = wrapper.get('[data-testid="results"]').text()

    expect(text).toContain('70.0%')
    expect(text).toContain('7 / 10')
    expect(text).toContain('82.5%')
    expect(wrapper.text()).toContain('Your data has been submitted successfully.')
  })

  it('tells when the data could not be submitted', async () => {
    const wrapper = await mountSuspended(QuizResults, { props: { attemptsLeft: 2, hasSubmissionFailed: true, result } })

    expect(wrapper.text()).toContain('Error submitting data')
  })

  it('offers another try while attempts are left', async () => {
    const withAttempts = await mountSuspended(QuizResults, {
      props: { attemptsLeft: 2, hasSubmissionFailed: false, result },
    })
    const withoutAttempts = await mountSuspended(QuizResults, {
      props: { attemptsLeft: 0, hasSubmissionFailed: false, result },
    })

    await withAttempts.get('button').trigger('click')

    expect(withAttempts.emitted('retry')).toHaveLength(1)
    expect(withoutAttempts.find('button').exists()).toBe(false)
  })
})
