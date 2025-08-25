import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from '../ChatInterface';

// Mock fetch globally
beforeEach(() => {
  global.fetch = vi.fn().mockImplementation((url, options) => {
    if (typeof options?.body === 'string' && options.body.includes('fail')) {
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Backend error' })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ response: 'AI says hello!' })
    });
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('ChatInterface', () => {
  it('renders welcome message', () => {
    render(<ChatInterface />);
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });

  it('allows user to send a message and shows it in chat', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText(/type your question/i);
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByText('Hello AI')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('AI says hello!')).toBeInTheDocument());
  });

  it('shows loading indicator while waiting for AI', async () => {
    let resolveFetch: any;
    (global.fetch as any).mockImplementationOnce(() => new Promise(res => { resolveFetch = res; }));
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText(/type your question/i);
    fireEvent.change(input, { target: { value: 'Test loading' } });
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    resolveFetch({ ok: true, json: () => Promise.resolve({ response: 'AI done' }) });
    await waitFor(() => expect(screen.getByText('AI done')).toBeInTheDocument());
  });

  it('shows error if backend fails', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText(/type your question/i);
    fireEvent.change(input, { target: { value: 'fail' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(screen.getByText(/backend error/i)).toBeInTheDocument());
  });
}); 