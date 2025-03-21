import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/components/ui/Toasts/use-toast';
import { useWebsite } from '@/contexts/WebsiteContext';

export const handleCountrySelect = async (userId: string, country: string, onSuccess?: () => void) => {
  const supabase = createClientComponentClient();
  const { currentWebsite } = useWebsite();
  
  try {
    // First check if a record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('business_information')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
      throw fetchError;
    }

    let error;
    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('business_information')
        .update({ target_country: country })
        .eq('business_id', currentWebsite?.id);
      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('business_information')
        .insert({ 
          user_id: userId,
          target_country: country,
          business_id: currentWebsite?.id
        });
      error = insertError;
    }

    if (error) throw error;
    
    toast({
      title: "Success",
      description: "Target country updated successfully",
    });
    
    onSuccess?.();
  } catch (error: any) {
    console.error('Error updating target country:', error);
    toast({
      title: "Error",
      description: "Failed to update target country",
      variant: "destructive"
    });
  }
}; 