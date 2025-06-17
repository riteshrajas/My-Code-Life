import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const FamilyProtectedRoute = () => {
  const [familyMember, setFamilyMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedMember = localStorage.getItem('familyMember');
    if (storedMember) {
      setFamilyMember(JSON.parse(storedMember));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return familyMember ? <Outlet /> : <Navigate to="/ritesh" replace />;
};

export default FamilyProtectedRoute;
