// Logout button — present on every page when authenticated
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    try {
        const tokenRes = await fetch("/antiforgery/token");
        if (tokenRes.ok) {
            const { token } = await tokenRes.json();
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "X-XSRF-TOKEN": token },
            });
        }
    } catch { /* ignore — redirect regardless */ }
    window.location.href = "/";
});
