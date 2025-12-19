import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Admin client with service role key (full access) - lazy initialization
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration for admin operations");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to check if current user is admin
async function isAdmin(): Promise<boolean> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

// GET - List all users
export async function GET() {
  try {
    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    // Get all users from auth.users via admin API
    const supabaseAdmin = getSupabaseAdmin();
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des utilisateurs" },
        { status: 500 }
      );
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des profils" },
        { status: 500 }
      );
    }

    // Merge auth users with profiles
    const users = authUsers.users.map((authUser) => {
      const profile = profiles?.find((p) => p.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        nom: profile?.nom || "",
        prenom: profile?.prenom || "",
        role: profile?.role || "client",
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Invite a new user
export async function POST(request: Request) {
  try {
    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, nom, prenom, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email et rôle requis" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "developpeur_nocode", "developpeur_automatisme", "commercial", "client"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Invite user via Supabase Admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        nom,
        prenom,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
    });

    if (inviteError) {
      console.error("Error inviting user:", inviteError);

      if (inviteError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "Cet email est déjà enregistré" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    // Create profile for the invited user
    if (inviteData.user) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: inviteData.user.id,
          email: email,
          nom: nom || "",
          prenom: prenom || "",
          role: role,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't fail the request, the profile can be created later
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invitation envoyée à ${email}`,
      user: inviteData.user,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/users:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
