import { AuthButton } from "@coinbase/cdp-react";

export default function Auth() {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      padding: "20px"
    }}>
      <AuthButton />
    </div>
  );
}

