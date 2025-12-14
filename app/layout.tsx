import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoCAM",
  description: "AutoCAM",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
      </head>
      <body className="text-foreground">
        <nav className="navbar navbar-expand-lg navbar-dark gh-header border-bottom">
          <div className="container-fluid">
            <a className="navbar-brand gh-brand" href="/dashboard">AutoCAM</a>
            <div className="d-flex gap-3">
              <a className="nav-link gh-link" href="/settings">Settings</a>
              <form method="post" action="/api/logout">
                <button className="nav-link gh-link">Logout</button>
              </form>
            </div>
          </div>
        </nav>
        <div className="container-fluid py-3">
          {/* {% with messages = get_flashed_messages(with_categories=true) %}
          {% if messages %}
          <div class="container">
            {% for category, message in messages %}
            <div class="alert alert-{{ 'warning' if category=='danger' else category }} gh-alert">
              {{ message }}
            </div>
            {% endfor %}
          </div>
          {% endif %}
          {% endwith %} */}
          {children}
        </div>
      </body>
    </html>
  );
}
