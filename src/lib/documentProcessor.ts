import OpenAI from 'openai';
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  DocumentReference 
} from 'firebase/firestore';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function processDocument(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that processes company documents. Extract key information and insights from the provided content."
        },
        {
          role: "user",
          content: `Please analyze this document and extract key information: ${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

export async function processUnprocessedDocuments(userId: string) {
  try {
    // Query for unprocessed documents
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId),
      where('processed', '==', false)
    );

    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      const documentData = doc.data();
      
      // Process the document content
      const analysis = await processDocument(documentData.content);
      
      // Update the document with the analysis
      await updateDoc(doc.ref as DocumentReference, {
        analysis: analysis,
        processed: true,
        processedAt: new Date().toISOString()
      });
    }

    return querySnapshot.docs.length; // Return number of processed documents
  } catch (error) {
    console.error('Error processing documents:', error);
    throw error;
  }
}
