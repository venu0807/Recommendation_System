import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./Context"

const PrivateRoute = ({ children, ...rest }) => {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
