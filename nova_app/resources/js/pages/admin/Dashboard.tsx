import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import UnderConstruction from '@/components/UnderConstruction';
export default function Dashboard() {
    const [message, setMessage] = useState('');
    function logout() {
        setMessage('');
        router.delete('/logout', {
            onHttpException: () => {
                setMessage('No se pudo cerrar la sesión.');
                return false;
            },
            onNetworkError: () => {
                setMessage('No se pudo conectar con AppNova.');
                return false;
            },
        });
    }
    return (
        <>
            <Head title="Administración" />
            <UnderConstruction
                title="Dashboard administrativo en construccion"
                message={message}
                onLogout={logout}
            />
        </>
    );
}
