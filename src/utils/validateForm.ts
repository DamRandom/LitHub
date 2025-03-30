export interface ValidationErrors {
    email?: string;
    password?: string;
  }
  
  export const validateForm = (email: string, password: string): ValidationErrors => {
    const errors: ValidationErrors = {};
  
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      errors.email = "Invalid email format.";
    }
  
    if (!password.trim()) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }
  
    return errors;
  };
  