"use client"

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

    // Mapping the URL error codes from Middleware to your specific messages
    const errorMessages: Record<string, string> = {
        not_on_office_wifi: "Access Denied: Please connect to the Office Wi-Fi to use this portal.",
        missing_info: "Severe problem with login information. Please contact the admin department.", // secret found in DB but not in browser storage
        wrong_laptop: "Security Alert: Please login from your own work laptop.",
        CredentialsSignin: "Invalid email or password. Please try again."
    };

    useEffect(() => {
        // Check if there is an error code in the URL (sent by middleware)
        const errorCode = searchParams.get('error');
        if (errorCode && errorMessages[errorCode]) {
            setError(errorMessages[errorCode]);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            // NextAuth default error for wrong creds is "CredentialsSignin"
            setError(errorMessages["CredentialsSignin"]);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className='flex min-h-screen items-center justify-center bg-gray-50'>
            <div className='w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg'>
                <div>
                    <h2 className='text-center text-3xl font-bold tracking-tight text-gray-900'>
                        Web Crawler Portal
                    </h2>
                    <p className='mt-2 text-center text-sm text-gray-600'>
                        Sign in to manage your crawler tasks
                    </p>
                </div>
                <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
                    {error && (
                        <div className='rounded-md bg-red-50 border border-red-200 p-3 text-center text-sm text-red-600 font-medium'>
                            {error}
                        </div>
                    )}
                    <div className='space-y-4 rounded-md shadow-sm'>
                        <input
                            type="email"
                            required
                            className='relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm'
                            placeholder='Email address'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            required
                            className='relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm'
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className='group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors'
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}