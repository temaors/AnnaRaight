import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the funnel start page
  redirect('/start');
}