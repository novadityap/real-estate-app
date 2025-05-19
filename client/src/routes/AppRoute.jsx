import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from 'react-router';

import AppLayout from '@/components/layouts/AppLayout';
import Home from '@/pages/public/Home';
import Signin from '@/pages/public/Signin';
import Signup from '@/pages/public/Signup';
import VerifyEmail from '@/pages/public/VerifyEmail';
import ResendVerification from '@/pages/public/ResendVerification';
import RequestResetPassword from '@/pages/public/RequestResetPassword';
import ResetPassword from '@/pages/public/ResetPassword';
import Unauthorized from '@/pages/public/Unauthorized';
import Profile from '@/pages/private/Profile';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import User from '@/pages/private/User';
import Role from '@/pages/private/Role';
import NotFound from '@/pages/public/NotFound';
import PrivateRoute from '@/routes/PrivateRoute';
import DashboardEntry from '@/routes/DashboardEntry';
import Property from '@/pages/private/Property';
import PropertyDetail from '@/pages/public/PropertyDetail';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="signin" element={<Signin />} />
        <Route path="signup" element={<Signup />} />
        <Route path="resend-verification" element={<ResendVerification />} />
        <Route
          path="request-reset-password"
          element={<RequestResetPassword />}
        />
        <Route path="reset-password/:resetToken" element={<ResetPassword />} />
        <Route
          path="verify-email/:verificationToken"
          element={<VerifyEmail />}
        />
        <Route path="properties/:propertyId" element={<PropertyDetail />} />
      </Route>
      <Route element={<PrivateRoute requiredRoles={['admin', 'user']} />}>
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardEntry />} />
          <Route element={<PrivateRoute requiredRoles={['user', 'admin']} />}>
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route element={<PrivateRoute requiredRoles={['admin']} />}>
            <Route path="properties" element={<Property />} />
            <Route path="users" element={<User />} />
            <Route path="roles" element={<Role />} />
          </Route>
        </Route>
      </Route>
      <Route path="unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

const AppRoute = () => {
  return <RouterProvider router={router} />;
};

export default AppRoute;
