import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function Companies() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await api.get("/companies/");
    setCompanies(res.data.results);
  };

  return (
    <>
      <Navbar />

      <div className="p-6">

        <h2 className="text-xl font-bold mb-4">
          Companies
        </h2>

        <table className="w-full border">

          <thead>
            <tr className="bg-gray-200">
              <th>Name</th>
              <th>Industry</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border">

                <td>{c.name}</td>
                <td>{c.industry}</td>

                <td>
                  <Link
                    to={`/companies/${c.id}`}
                    className="text-blue-600"
                  >
                    View
                  </Link>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </>
  );
}