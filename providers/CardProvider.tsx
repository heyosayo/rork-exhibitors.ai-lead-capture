import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { BusinessCard } from "@/types/card";

const STORAGE_KEY = "business_cards";

export const [CardProvider, useCards] = createContextHook(() => {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCards = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedCards = JSON.parse(stored);
        // Migrate existing cards to have eventId field
        const migratedCards = parsedCards.map((card: any) => ({
          ...card,
          eventId: card.eventId || null,
          linkedinUrl: card.linkedinUrl || null,
          profilePhotoUrl: card.profilePhotoUrl || null,
          officePhone: card.officePhone ?? null,
          cellPhone: card.cellPhone ?? null,
          faxPhone: card.faxPhone ?? null,
        }));
        setCards(migratedCards);
        
        // Save migrated cards back to storage
        if (JSON.stringify(parsedCards) !== JSON.stringify(migratedCards)) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedCards));
        }
      }
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCards = useCallback(async (newCards: BusinessCard[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
      setCards(newCards);
    } catch (error) {
      console.error("Error saving cards:", error);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const searchLinkedInProfile = useCallback(async (card: BusinessCard): Promise<string | null> => {
    try {
      if (!card.name && !card.company) {
        return null;
      }

      // Create search query based on name and company only
      const searchTerms = [];
      if (card.name) searchTerms.push(card.name);
      if (card.company) searchTerms.push(card.company);
      
      const query = searchTerms.join(' ');
      
      // Use a simple LinkedIn search URL format
      // This will open LinkedIn search results for the person
      const linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
      
      console.log('Generated LinkedIn search URL:', linkedinSearchUrl);
      return linkedinSearchUrl;
    } catch (error) {
      console.error('Error searching LinkedIn profile:', error);
      return null;
    }
  }, []);

  const searchLinkedInProfilePhoto = useCallback(async (card: BusinessCard): Promise<string | null> => {
    try {
      if (!card.name && !card.company) {
        return null;
      }

      // Create search query for finding LinkedIn profile photo using name and company only
      const searchTerms = [];
      if (card.name) searchTerms.push(card.name);
      if (card.company) searchTerms.push(card.company);
      
      const query = searchTerms.join(' ');
      
      console.log('Searching for LinkedIn profile photo for:', query);
      
      // Use AI to search for LinkedIn profile photo
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a LinkedIn profile researcher. Given a person's name, company, and title, help find their LinkedIn profile photo URL. Look for publicly available LinkedIn profile photos. Return the information in JSON format with a 'profilePhotoUrl' field. If you cannot find a reliable photo URL, return null for that field. Only return photo URLs you are confident about and that are publicly accessible.`
            },
            {
              role: 'user',
              content: `Find the LinkedIn profile photo for:\nName: ${card.name || 'Unknown'}\nCompany: ${card.company || 'Unknown'}\n\nPlease provide their LinkedIn profile photo URL in JSON format. Focus on matching by name and company, not job title.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search for LinkedIn profile photo');
      }

      const data = await response.json();
      const completion = data.completion;
      
      // Try to parse JSON from the completion
      try {
        // Clean the response to remove any markdown formatting or extra text
        let cleanedCompletion = completion.trim();
        
        // Remove markdown code blocks if present
        cleanedCompletion = cleanedCompletion.replace(/```json\n?|\n?```/g, '');
        
        // Try to extract JSON from the response if it contains other text
        const jsonMatch = cleanedCompletion.match(/\{[^}]*\}/s);
        if (jsonMatch) {
          cleanedCompletion = jsonMatch[0];
        }
        
        console.log('Attempting to parse LinkedIn photo info:', cleanedCompletion);
        
        const photoInfo = JSON.parse(cleanedCompletion);
        
        // Return the profile photo URL if found
        if (photoInfo.profilePhotoUrl && typeof photoInfo.profilePhotoUrl === 'string' && photoInfo.profilePhotoUrl.trim() !== '') {
          return photoInfo.profilePhotoUrl.trim();
        }
        
        return null;
      } catch (parseError) {
        console.error('Error parsing LinkedIn photo response:', parseError);
        console.error('Raw completion was:', completion);
        return null;
      }
    } catch (error) {
      console.error('Error searching for LinkedIn profile photo:', error);
      return null;
    }
  }, []);

  const searchMissingContactInfo = useCallback(async (card: BusinessCard): Promise<{ email?: string; officePhone?: string; cellPhone?: string; faxPhone?: string; }> => {
    try {
      if (!card.name && !card.company) {
        return {};
      }

      // Create search query for finding contact information using name and company only
      const searchTerms = [];
      if (card.name) searchTerms.push(card.name);
      if (card.company) searchTerms.push(card.company);
      
      const query = searchTerms.join(' ');
      
      console.log('Searching for contact info for:', query);
      
      // Use AI to search for contact information (email and specific phone types only)
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a contact information researcher. Given a person's name and company, help find their likely company email address and any available phone numbers split into specific fields. Return ONLY JSON with fields: email, officePhone, cellPhone, faxPhone. If a field is not found, use an empty string. Only return information you are confident about.`
            },
            {
              role: 'user',
              content: `Find contact information for:\nName: ${card.name || 'Unknown'}\nCompany: ${card.company || 'Unknown'}\n\nReturn ONLY JSON with: {\n  "email": "",\n  "officePhone": "",\n  "cellPhone": "",\n  "faxPhone": ""\n}\nFocus on matching by name and company, not job title.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search for contact info');
      }

      const data = await response.json();
      const completion = data.completion;
      
      // Try to parse JSON from the completion
      try {
        // Clean the response to remove any markdown formatting or extra text
        let cleanedCompletion = completion.trim();
        
        // Remove markdown code blocks if present
        cleanedCompletion = cleanedCompletion.replace(/```json\n?|\n?```/g, '');
        
        // Try to extract JSON from the response if it contains other text
        const jsonMatch = cleanedCompletion.match(/\{[^}]*\}/s);
        if (jsonMatch) {
          cleanedCompletion = jsonMatch[0];
        }
        
        console.log('Attempting to parse contact info:', cleanedCompletion);
        
        const contactInfo = JSON.parse(cleanedCompletion);
        const result: { email?: string; officePhone?: string; cellPhone?: string; faxPhone?: string; } = {};
        
        if (!card.email && typeof contactInfo.email === 'string' && contactInfo.email.trim() !== '') {
          result.email = contactInfo.email.trim();
        }
        if (!card.officePhone && typeof contactInfo.officePhone === 'string' && contactInfo.officePhone.trim() !== '') {
          result.officePhone = contactInfo.officePhone.trim();
        }
        if (!card.cellPhone && typeof contactInfo.cellPhone === 'string' && contactInfo.cellPhone.trim() !== '') {
          result.cellPhone = contactInfo.cellPhone.trim();
        }
        if (!card.faxPhone && typeof contactInfo.faxPhone === 'string' && contactInfo.faxPhone.trim() !== '') {
          result.faxPhone = contactInfo.faxPhone.trim();
        }
        
        return result;
      } catch (parseError) {
        console.error('Error parsing contact info response:', parseError);
        console.error('Raw completion was:', completion);
        return {};
      }
    } catch (error) {
      console.error('Error searching for contact info:', error);
      return {};
    }
  }, []);

  const addCard = useCallback(async (card: BusinessCard) => {
    try {
      // Search for LinkedIn profile when adding a new card
      const linkedinUrl = await searchLinkedInProfile(card);
      
      // Search for LinkedIn profile photo
      const profilePhotoUrl = await searchLinkedInProfilePhoto(card);
      
      // Search for missing contact information
      const missingInfo = await searchMissingContactInfo(card);
      
      const cardWithEnhancements: BusinessCard = { 
        ...card, 
        linkedinUrl,
        profilePhotoUrl,
        email: card.email || missingInfo.email || null,
        officePhone: card.officePhone || missingInfo.officePhone || null,
        cellPhone: card.cellPhone || missingInfo.cellPhone || null,
        faxPhone: card.faxPhone || missingInfo.faxPhone || null,
        phone: card.phone ?? null
      };
      
      const newCards = [...cards, cardWithEnhancements];
      await saveCards(newCards);
    } catch (error) {
      console.error('Error adding card:', error);
      // Fallback: add card without enhancements
      const newCards = [...cards, card];
      await saveCards(newCards);
    }
  }, [cards, saveCards, searchLinkedInProfile, searchLinkedInProfilePhoto, searchMissingContactInfo]);

  const updateCard = useCallback((id: string, updates: Partial<BusinessCard>) => {
    const newCards = cards.map(card => 
      card.id === id ? { ...card, ...updates } : card
    );
    saveCards(newCards);
  }, [cards, saveCards]);

  const deleteCard = useCallback((id: string) => {
    const newCards = cards.filter(card => card.id !== id);
    saveCards(newCards);
  }, [cards, saveCards]);

  const clearAllCards = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setCards([]);
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await loadCards();
  }, [loadCards]);

  return useMemo(() => ({
    cards,
    isLoading,
    addCard,
    updateCard,
    deleteCard,
    clearAllCards,
    refetch,
    searchLinkedInProfile,
    searchMissingContactInfo,
  }), [
    cards,
    isLoading,
    addCard,
    updateCard,
    deleteCard,
    clearAllCards,
    refetch,
    searchLinkedInProfile,
    searchMissingContactInfo,
  ]);
});