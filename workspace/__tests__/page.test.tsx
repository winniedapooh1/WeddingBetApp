import { render, screen } from '@testing-library/react';
import Home from '../app/page'; // Adjust path if your 'app' directory is not in 'src'

describe('Home Page', () => {
  it('renders a welcome heading', () => {
    render(<Home />); 

    // Assuming your default Next.js starter page has an h1 or similar
    // with text that includes "Welcome" or your app's name.
    // Adjust the regex if the text is different in your Next.js 15 default page.
    const heading = screen.getByRole('heading', { 
      name: /Welcome|Next\.js|WeddingBetApp/i 
    });

    expect(heading).toBeInTheDocument();
  });

  // You can add more tests here as you develop
});