export default function DashboardHome() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome to the Portal</h1>
            <p className="mt-4 text-gray-600">Select a tool from the sidebar to get started.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
                    <h3 className="font-semibold text-blue-800">Security Note</h3>
                    <p className="text-sm text-blue-600 mt-2">
                        Your access is restricted to authorized tools and the office network.
                    </p>
                </div>
            </div>
        </div>
    );
}