import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/permissions';

export function usePermissions() {
  const { currentMember } = useAuth();

  const role = currentMember?.role || "member";

  const can = (perm) => {
    return PERMISSIONS[role]?.[perm] || false;
  };

  return { can, role };
}
