import React from "react"
import { NavLink, Outlet } from "react-router"

export function Layout() {
    return (
        <>
            <nav>
                <ul>
                    <li>
                        <NavLink to="/" viewTransition>Home</NavLink>
                    </li>
                    <li>
                        <NavLink to="/about" viewTransition>About</NavLink>
                    </li>
                    <li>
                        <NavLink to="/not-found" viewTransition>Not Found</NavLink>
                    </li>
                </ul>
            </nav>
            <Outlet />
        </>
    )
}