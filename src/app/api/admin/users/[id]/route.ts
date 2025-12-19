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

// PATCH - Update user role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { role, nom, prenom } = body;

    // Validate role if provided
    if (role) {
      const validRoles = ["admin", "developpeur_nocode", "developpeur_automatisme", "commercial", "client"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Rôle invalide" },
          { status: 400 }
        );
      }
    }

    // Update profile
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (role) updateData.role = role;
    if (nom !== undefined) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;

    const supabaseAdmin = getSupabaseAdmin();
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du profil" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour",
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get current user to prevent self-deletion
    const supabase = await createServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser?.id === id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    // Delete user via admin API
    const supabaseAdmin = getSupabaseAdmin();
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/users/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
