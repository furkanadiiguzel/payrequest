import LoginForm from './LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ returnUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnUrl } = await searchParams;
  return <LoginForm returnUrl={returnUrl} />;
}
