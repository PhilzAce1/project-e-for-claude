
// Get user's Google Search Console connections
async function getGSCConnections(supabase: any, userId: string) {
    const isConnected = await isGoogleServiceConnected(
      supabase,
      userId,
      'searchConsole'
    );
  
    console.log('IS CONNECTED', isConnected, userId);
    if (!isConnected) {
      return null;
    }
  
    const { data, error } = await supabase
      .from('gsc_connections')
      .select('*')
      .eq('user_id', userId);
  
    if (error) {
      console.error('Error fetching GSC connections:', error);
      return null;
    }
  
    return data;
  }
  
  // Get user's Google Tag Manager connections
  async function getGTMConnections(supabase: any, userId: string) {
    const isConnected = await isGoogleServiceConnected(
      supabase,
      userId,
      'tagManager'
    );
    if (!isConnected) {
      return null;
    }
  
    const { data, error } = await supabase
      .from('gtm_connections')
      .select('*')
      .eq('user_id', userId);
  
    if (error) {
      console.error('Error fetching GTM connections:', error);
      return null;
    }
  
    return data;
  }
  
  // Get user's Google Analytics connections
  async function getGAConnections(supabase: any, userId: string) {
    const isConnected = await isGoogleServiceConnected(
      supabase,
      userId,
      'analytics'
    );
    if (!isConnected) {
      return null;
    }
  
    const { data, error } = await supabase
      .from('ga_connections')
      .select('*')
      .eq('user_id', userId);
  
    if (error) {
      console.error('Error fetching GA connections:', error);
      return null;
    }
  
    return data;
  }
  
  async function isGoogleServiceConnected(
    supabase: any,
    userId: string,
    service: string
  ) {
    let tableName;
    switch (service) {
      case 'tagManager':
        tableName = 'gtm_connections';
        break;
      case 'searchConsole':
        tableName = 'gsc_connections';
        break;
      case 'analytics':
        tableName = 'ga_connections';
        break;
      default:
        throw new Error('Invalid service');
    }
  
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .single();
  
    if (error) {
      return false;
    }
  
    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at);
      const currentDate = new Date();
      if (expiryDate.getTime() < currentDate.getTime()) {
        try {
          const { error: deleteError, data: deletedData } = await supabase
            .from(tableName)
            .delete()
            .eq('user_id', userId);
  
          if (deleteError) {
            console.error(
              `Error deleting expired token from ${tableName}:`,
              deleteError
            );
          } else {
            console.log(
              `Successfully deleted expired token from ${tableName} for user ${userId}`,
              deletedData
            );
          }
        } catch (deleteException) {
          console.error(
            `Exception when deleting expired token from ${tableName}:`,
            deleteException
          );
        }
        return false;
      }
    }
  
    return true;
  }
  
   async function getAllGoogleConnections(supabase: any, userId: string) {
    const [gsc, gtm, ga] = await Promise.all([
      getGSCConnections(supabase, userId),
      getGTMConnections(supabase, userId),
      getGAConnections(supabase, userId)
    ]);
  
    return {
      searchConsole: gsc?.[0] || null,
      tagManager: gtm?.[0] || null,
      analytics: ga?.[0] || null
    };
  }

  export { getAllGoogleConnections, isGoogleServiceConnected, getGSCConnections, getGTMConnections, getGAConnections};