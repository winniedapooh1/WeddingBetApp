import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'; // Import act
import '@testing-library/jest-dom';
import Home from '../app/page'; 
import { collection, onSnapshot, query } from 'firebase/firestore'; // Import necessary Firestore functions for mocking

// Mock the 'fetch' API globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock Firebase Auth functions directly
let mockSignOut: jest.Mock;
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signOut: (...args: any[]) => mockSignOut(...args),
}));

// Mock Firestore functions
let mockUnsubscribe: jest.Mock; // To capture the unsubscribe function returned by onSnapshot

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})), // Mock getFirestore
  collection: jest.fn((db, path) => ({ db, path })), // Mock collection
  query: jest.fn(c => c), // Mock query
  onSnapshot: jest.fn((...args: any[]) => { // onSnapshot is now directly a jest.fn()
    return mockUnsubscribe; // Return a mock unsubscribe function
  }),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
}));


let mockCurrentUser: any = null;
let mockLoading: boolean = false;
let mockIsAdmin: boolean = false; // Add isAdmin mock
let mockIsAdminLoading: boolean = false; // Add isAdminLoading mock
let mockLogout: jest.Mock = jest.fn(() => Promise.resolve());

jest.mock('../app/context/AuthContext', () => ({
  // eslint-disable-next-line react/display-name
  AuthContextProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    currentUser: mockCurrentUser,
    loading: mockLoading,
    isAdmin: mockIsAdmin, // Provide isAdmin
    isAdminLoading: mockIsAdminLoading, // Provide isAdminLoading
    logout: mockLogout,
  }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    isReady: true,
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));


describe('Home Component', () => {
  // Clear mocks and reset mock states before each test to ensure isolation
  beforeEach(() => {
    mockSignOut = jest.fn(() => Promise.resolve());
    mockUnsubscribe = jest.fn(); // Reset unsubscribe mock

    mockCurrentUser = null;
    mockLoading = false;
    mockIsAdmin = false;
    mockIsAdminLoading = false;
    mockLogout.mockClear();
    mockPush.mockClear();
    mockSignOut.mockClear();
    (global.fetch as jest.Mock).mockClear();
    (require('next/navigation').useRouter as jest.Mock).mockClear();
    (require('next/navigation').usePathname as jest.Mock).mockClear();
    (require('next/navigation').useSearchParams as jest.Mock).mockClear();
    (collection as jest.Mock).mockClear();
    (query as jest.Mock).mockClear();
    (onSnapshot as jest.Mock).mockClear(); // Now this will work correctly
  });

  // Helper to simulate Firestore snapshot
  const simulateFirestoreSnapshot = (data: any[]) => {
    // Get the onSnapshot callback function from the mock call
    // This assumes the first argument to onSnapshot is the query, and the second is the callback
    const callback = (onSnapshot as jest.Mock).mock.calls[0][1];
    
    // Create a mock QuerySnapshot object with a forEach method
    const mockQuerySnapshot = {
      empty: data.length === 0,
      docs: data.map(item => ({
        id: item.userId, // Use userId as doc.id for homepageWinners
        data: () => item,
      })),
      forEach: jest.fn(callback => { // Mock forEach method
        data.forEach(item => callback({ id: item.userId, data: () => item }));
      }),
    };

    callback(mockQuerySnapshot);
  };

  test('renders the Navbar component', () => {
    render(<Home />);
    const brandLink = screen.getByRole('link', { name: /Wedding Wagers/i });
    expect(brandLink).toBeInTheDocument();
    const navbarElement = screen.getByRole('navigation');
    expect(navbarElement).toBeInTheDocument();
  });

  test('renders "View All Bets" link and it is clickable', () => {
    render(<Home />);
    const viewAllBetsLink = screen.getByRole('link', { name: /View All Bets/i });
    expect(viewAllBetsLink).toBeInTheDocument();
    expect(viewAllBetsLink).toHaveAttribute('href', '/bets');
  });

  test('renders "Learn More" link and it is clickable', () => {
    render(<Home />);
    const learnMoreLink = screen.getByRole('link', { name: /Learn More/i });
    expect(learnMoreLink).toBeInTheDocument();
    expect(learnMoreLink).toHaveAttribute('href', '/about');
  });

  test('Navbar renders Home, Bets, About links', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bets' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
  });

  test('Navbar renders Login button when not authenticated', () => {
    mockCurrentUser = null;
    mockLoading = false;
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  test('Navbar renders Logout button when authenticated and handles logout', async () => {
    mockCurrentUser = { uid: 'test-user-id', email: 'test@example.com' };
    mockLoading = false;
    render(<Home />);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    expect(logoutButton).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();

    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  test('Navbar renders loading state for auth', () => {
    mockLoading = true;
    render(<Home />);
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  // --- New tests for Winner Display Section ---

  test('displays "Loading winners..." initially', () => {
    render(<Home />);
    expect(screen.getByText(/Loading winners.../i)).toBeInTheDocument();
  });
});
