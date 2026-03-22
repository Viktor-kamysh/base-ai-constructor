import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
    title: "Construction Pro Agent",
    description: "Bounded AI assistant for construction professionals.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Header />
                <main className="container" style={{ padding: '2rem 1rem' }}>
                    {children}
                </main>
            </body>
        </html>
    );
}
