import Home from './pages/Home';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import Trending from './pages/Trending';
import Couple from './pages/Couple';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuth2Redirect from './pages/OAuth2Redirect';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';



export const PAGES = {
    "Home": Home,
    "Search": Search,
    "Trending": Trending,
    "Favorites": Favorites,
    "Couple": Couple,
    "Pricing": Pricing,
    "Profile": Profile,
    "Welcome": Welcome,
    "Login": Login,
    "Register": Register,
    "oauth2/redirect": OAuth2Redirect,
    "verify-email": VerifyEmail,
    "forgot-password": ForgotPassword,
    "reset-password": ResetPassword,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};