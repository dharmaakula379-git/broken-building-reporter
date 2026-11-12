import React, { createContext, useContext, useState, useEffect } from "react";

const RoleContext = createContext();

export const DEMO_USERS = {
  citizen: {
    id: "user_cit_01",
    name: "Rajesh Kumar",
    email: "rajesh.citizen@gmail.com",
    role: "citizen",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    designation: "Civic Resident & Reporter",
    phone: "+91 98480 12345",
    location: "Vijayawada, AP"
  },
  authority: {
    id: "user_auth_01",
    name: "Er. K. Ramesh",
    email: "k.ramesh.safety@vijayawada.gov.in",
    role: "authority",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    designation: "Senior Structural Assessor",
    department: "Building Safety Dept.",
    badgeNumber: "VMC-INSP-408",
    phone: "+91 866 242 8899"
  }
};

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => {
    return localStorage.getItem("bbr_role") || "citizen";
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("bbr_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // fallback
      }
    }
    const initialRole = localStorage.getItem("bbr_role") || "citizen";
    return DEMO_USERS[initialRole] || DEMO_USERS.citizen;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("bbr_auth") === "true";
  });

  const login = (chosenRole, email, password) => {
    const targetRole = chosenRole || "citizen";
    const base = DEMO_USERS[targetRole] || DEMO_USERS.citizen;
    let displayName = base.name;
    if (email && email !== base.email) {
      const prefix = email.split("@")[0].replace(/[._]/g, " ");
      displayName = prefix.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    const userProfile = {
      ...base,
      name: displayName,
      email: email || base.email
    };
    setUser(userProfile);
    setRoleState(targetRole);
    setIsAuthenticated(true);
    localStorage.setItem("bbr_role", targetRole);
    localStorage.setItem("bbr_user", JSON.stringify(userProfile));
    localStorage.setItem("bbr_auth", "true");
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("bbr_auth");
  };

  const setRole = (newRole) => {
    setRoleState(newRole);
    const newProfile = DEMO_USERS[newRole] || DEMO_USERS.citizen;
    setUser(newProfile);
    localStorage.setItem("bbr_role", newRole);
    localStorage.setItem("bbr_user", JSON.stringify(newProfile));
  };

  const toggleRole = () => {
    const nextRole = role === "citizen" ? "authority" : "citizen";
    setRole(nextRole);
  };

  useEffect(() => {
    localStorage.setItem("bbr_role", role);
    if (user) {
      localStorage.setItem("bbr_user", JSON.stringify(user));
    }
  }, [role, user]);

  return (
    <RoleContext.Provider
      value={{
        role,
        user,
        isAuthenticated,
        login,
        logout,
        setRole,
        toggleRole
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
