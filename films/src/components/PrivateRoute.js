import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./Context"

const PrivateRoute = ({ children, ...rest }) => {
  const { user } = useContext(UserContext);

  if (!user) {
    console.log("No User Autheticated");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
