"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useRouter } from "next/navigation";

type RolePermissions = Record<string, Record<string, boolean>>;

type AuthInfo = {
  roleName: string | null;
  permissions: RolePermissions | null;
  userId: string | null;
};

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authInfo, setAuthInfo] = useState<AuthInfo>({
    roleName: null,
    permissions: null,
    userId: null,
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }

      const authUserId = data.session.user.id;
      const { data: userRow, error } = await supabase
        .from("app_users")
        .select("is_active, roles(name, permissions)")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (error || !userRow || !userRow.is_active) {
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      const role = Array.isArray(userRow.roles) ? userRow.roles[0] : userRow.roles;

      setAuthInfo({
        roleName: role?.name ?? null,
        permissions: (role?.permissions as RolePermissions) ?? null,
        userId: authUserId,
      });
      setLoading(false);
    };

    load();
  }, [router]);

  return { loading, ...authInfo };
}
