const users = [
    {
      id: 1,
      email: "test@lithub.com",
      password: "$2a$10$z3Gc2YdXN2MbXbN94FljauS4D1V5bZn7NP6Lg/RKkYhM7R8i7phma" // hash de "password123"
    }
  ];
  
  export async function findUserByEmail(email: string) {
    return users.find((user) => user.email === email);
  }
  