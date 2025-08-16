import { supabase } from "@/lib/supabase";

export async function POST(request) {
  console.log("🔧 Setting up superadmin...");
  
  try {
    // Step 1: Update aryanaturalfarms@gmail.com to superadmin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: 'superadmin' })
      .eq('email', 'aryanaturalfarms@gmail.com')
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating user role:", updateError);
      return Response.json({
        success: false,
        error: updateError.message,
        hint: "Make sure the superadmin enum value exists in your database. Run admin-setup-step1.sql first."
      }, { status: 500 });
    }

    if (!updatedUser) {
      return Response.json({
        success: false,
        error: "User aryanaturalfarms@gmail.com not found",
        hint: "Make sure the user has logged in with Google first"
      }, { status: 404 });
    }

    console.log("✅ Successfully updated user:", updatedUser);

    // Step 2: Verify the update
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', 'aryanaturalfarms@gmail.com')
      .single();

    return Response.json({
      success: true,
      message: "Successfully set aryanaturalfarms@gmail.com as superadmin!",
      user: verifyUser,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
