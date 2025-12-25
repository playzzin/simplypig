import { AdminLayout } from "./features/adminLayout/AdminLayout";
import { BrowserRouter } from "react-router-dom";

function App() {
    return (
        <BrowserRouter>
            <AdminLayout />
        </BrowserRouter>
    );
}

export default App;
