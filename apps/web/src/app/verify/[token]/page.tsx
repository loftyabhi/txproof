import { Metadata } from 'next';
import { redirect } from 'next/navigation';

type Props = {
    params: Promise<{
        token: string;
    }>;
};

export const metadata: Metadata = {
    title: 'Verifying Email...',
    robots: {
        index: false,
        follow: false,
    }
};

export default async function VerifyPathRedirect({ params }: Props) {
    const { token } = await params;

    if (token) {
        redirect(`/verify?token=${token}`);
    }

    redirect('/verify');
}
