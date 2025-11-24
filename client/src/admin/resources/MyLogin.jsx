import { Login, LoginForm } from "react-admin";
import { Box, Card, CardContent } from "@mui/material";
import adminLoginGB from "../../assets/admin/adminBG.png";

const MyLogin = () => (
  <Box
    sx={{
      backgroundImage: `url(${adminLoginGB})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Card sx={{ minWidth: 300 }}>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  </Box>
);

export default MyLogin;
