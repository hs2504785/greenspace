import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Initial session:', {
      id: session.user.id,
      email: session.user.email
    });

    // First find or create user
    let userId = session.user.id;
    
    if (!userId) {
      // Try to find user by email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log('Found user by email:', existingUser);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: session.user.email,
            name: session.user.name,
            avatar_url: session.user.image,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return new Response(JSON.stringify({ 
            message: 'Failed to create user profile',
            details: createError.message 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        userId = newUser.id;
        console.log('Created new user:', newUser);
      }
    }

    console.log('Using user ID:', userId);

    // Get user profile
    console.log('Fetching user profile for ID:', userId);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, whatsapp_number, updated_at')
      .eq('id', userId)
      .single();

    console.log('Fetch result:', { user, error });

    if (error) {
      console.error('Error fetching user profile:', error);
      return new Response(JSON.stringify({ message: 'Failed to fetch profile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in GET profile:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Initial session:', {
      id: session.user.id,
      email: session.user.email
    });

    // First find or create user
    let userId = session.user.id;
    
    if (!userId) {
      // Try to find user by email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log('Found user by email:', existingUser);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: session.user.email,
            name: session.user.name,
            avatar_url: session.user.image,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return new Response(JSON.stringify({ 
            message: 'Failed to create user profile',
            details: createError.message 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        userId = newUser.id;
        console.log('Created new user:', newUser);
      }
    }

    console.log('Using user ID:', userId);
    
    const data = await request.json();
    console.log('Received request data:', data);
    
    const whatsapp_number = data.whatsapp_number;
    if (!whatsapp_number) {
      return new Response(JSON.stringify({ 
        message: 'WhatsApp number is required',
        details: 'whatsapp_number field is missing in request' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate whatsapp number format
    if (!/^[0-9]{10}$/.test(whatsapp_number)) {
      return new Response(JSON.stringify({ 
        message: 'Please enter a valid 10-digit phone number',
        details: 'WhatsApp number must be exactly 10 digits'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update the user
    console.log('Attempting to update user:', {
      userId,
      whatsapp_number,
      timestamp: new Date().toISOString()
    });

    // First do the update
    console.log('Executing update query:', {
      table: 'users',
      id: userId,
      data: {
        whatsapp_number,
        updated_at: new Date().toISOString()
      }
    });

    // Do the update with auth context
    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .update({ 
        whatsapp_number,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .limit(1);

    console.log('Update operation result:', {
      data: updatedData,
      error: updateError,
      userId,
      whatsapp_number
    });

    // Get the first result since update returns an array
    const updatedUser = updatedData?.[0];

    console.log('Update result:', { updateError });

    // Verify the update immediately
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('id, whatsapp_number, updated_at')
      .eq('id', userId)
      .single();

    console.log('Immediate verification:', { 
      verifyData, 
      verifyError,
      expectedNumber: whatsapp_number
    });

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return new Response(JSON.stringify({ 
        message: 'Failed to update profile',
        details: updateError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!updatedData || !updatedUser) {
      console.error('No data returned after update:', { updatedData });
      return new Response(JSON.stringify({ 
        message: 'Failed to update profile',
        details: 'No data returned after update'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Profile updated successfully:', updatedUser);

    return new Response(JSON.stringify({ 
      message: 'Profile updated successfully',
      user: updatedUser
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in profile update:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}