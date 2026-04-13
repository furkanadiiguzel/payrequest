import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign In' };

interface LoginPageProps {
  searchParams: Promise<{ returnUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnUrl } = await searchParams;
  return <LoginForm returnUrl={returnUrl} />;
}
