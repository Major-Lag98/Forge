// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginView } from './LoginView'

describe('LoginView', () => {
  it('renders the username input and a disabled submit button', () => {
    render(<LoginView onSignIn={() => {}} />)
    expect(screen.queryByPlaceholderText(/username/i)).not.toBeNull()
    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('enables submit and fires onSignIn with the trimmed username', async () => {
    const onSignIn = vi.fn()
    const user = userEvent.setup()
    render(<LoginView onSignIn={onSignIn} />)

    await user.type(screen.getByPlaceholderText(/username/i), '  alden  ')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(onSignIn).toHaveBeenCalledWith('alden')
  })

  it('keeps submit disabled for whitespace-only input', async () => {
    const user = userEvent.setup()
    render(<LoginView onSignIn={() => {}} />)

    await user.type(screen.getByPlaceholderText(/username/i), '   ')

    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('submits on Enter key', async () => {
    const onSignIn = vi.fn()
    const user = userEvent.setup()
    render(<LoginView onSignIn={onSignIn} />)

    await user.type(screen.getByPlaceholderText(/username/i), 'alden{Enter}')

    expect(onSignIn).toHaveBeenCalledWith('alden')
  })
})
