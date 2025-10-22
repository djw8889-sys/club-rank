import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  DocumentData,
  QuerySnapshot,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "./use-auth";

export function useFirestoreCollection<T>(
  collectionName: string,
  conditions: { field: string; operator: any; value: any }[] = [],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc'
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      let q = query(collection(db, collectionName));
      
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }

      const unsubscribe = onSnapshot(q, 
        (snapshot: QuerySnapshot<DocumentData>) => {
          const documents = snapshot.docs.map(doc => {
            const data = doc.data();
            // Normalize Firestore Timestamps to JavaScript Dates
            const normalizedData = { ...data };
            Object.keys(normalizedData).forEach(key => {
              if (normalizedData[key] instanceof Timestamp) {
                normalizedData[key] = normalizedData[key].toDate();
              }
              // Normalize nested comment timestamps
              if (key === 'comments' && Array.isArray(normalizedData[key])) {
                normalizedData[key] = normalizedData[key].map((comment: any) => ({
                  ...comment,
                  createdAt: comment.createdAt instanceof Timestamp ? comment.createdAt.toDate() : comment.createdAt
                }));
              }
            });
            return {
              id: doc.id,
              ...normalizedData
            };
          }) as T[];
          setData(documents);
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err);
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [collectionName, JSON.stringify(conditions), orderByField, orderDirection]);

  return { data, loading, error };
}

export function useFirestore() {
  const { user } = useAuth();

  const addDocument = async (collectionName: string, data: any) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  };

  const updateDocument = async (collectionName: string, docId: string, data: any) => {
    try {
      await updateDoc(doc(db, collectionName, docId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  };

  const uploadFile = async (file: File, path: string) => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const deleteDocument = async (collectionName: string, docId: string) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  };

  const acceptMatch = async (matchId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await runTransaction(db, async (transaction) => {
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await transaction.get(matchRef);
        
        if (!matchDoc.exists()) throw new Error("Match not found");
        
        const match = matchDoc.data();
        
        // Verify caller is the actual target from matchDoc
        if (user.uid !== match.targetId) throw new Error("Unauthorized: Only match target can accept");
        if (match.status !== 'pending') throw new Error("Match is not pending");
        
        const targetUserRef = doc(db, 'users', match.targetId);
        const targetUserDoc = await transaction.get(targetUserRef);
        
        if (!targetUserDoc.exists()) throw new Error("Target user not found");
        
        // Test version: No point requirements
        // const targetUser = targetUserDoc.data();
        // if (targetUser.points < match.pointsCost) throw new Error("Insufficient points");
        
        // Accept match - no points deducted in test version
        transaction.update(matchRef, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        });
        
        // Test version: No point deduction
        // transaction.update(targetUserRef, {
        //   points: increment(-match.pointsCost),
        // });
      });
    } catch (error) {
      console.error("Error accepting match:", error);
      throw error;
    }
  };

  const rejectMatch = async (matchId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await runTransaction(db, async (transaction) => {
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await transaction.get(matchRef);
        
        if (!matchDoc.exists()) throw new Error("Match not found");
        
        const match = matchDoc.data();
        
        // Verify caller is the actual target from matchDoc
        if (user.uid !== match.targetId) throw new Error("Unauthorized: Only match target can reject");
        if (match.status !== 'pending') throw new Error("Match is not pending");
        
        // Reject match and refund requester
        transaction.update(matchRef, {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
        });
        
        // Test version: No points were deducted, so no refund needed
        // const requesterRef = doc(db, 'users', match.requesterId);
        // transaction.update(requesterRef, {
        //   points: increment(match.pointsCost), // Refund the original cost
        // });
      });
    } catch (error) {
      console.error("Error rejecting match:", error);
      throw error;
    }
  };

  const completeMatch = async (matchId: string, result: 'requester_won' | 'target_won' | 'draw') => {
    if (!user) throw new Error("User not authenticated");

    try {
      await runTransaction(db, async (transaction) => {
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await transaction.get(matchRef);
        
        if (!matchDoc.exists()) throw new Error("Match not found");
        
        const match = matchDoc.data();
        
        // Verify caller is a participant using IDs from matchDoc
        if (user.uid !== match.requesterId && user.uid !== match.targetId) {
          throw new Error("Unauthorized: Only match participants can complete match");
        }
        
        if (match.status === 'completed') throw new Error("Match already completed");
        if (match.status !== 'accepted') throw new Error("Match must be accepted first");
        
        // Use participant IDs from matchDoc (source of truth)
        const requesterRef = doc(db, 'users', match.requesterId);
        const targetRef = doc(db, 'users', match.targetId);
        
        // Update match with result
        transaction.update(matchRef, {
          status: 'completed',
          result: result,
          completedAt: serverTimestamp(),
          completedBy: user.uid,
        });

        // Update user stats based on result
        if (result === 'requester_won') {
          // Winner gets full refund + bonus points + 1 win
          transaction.update(requesterRef, {
            points: increment(25), // Test version: just +25P bonus
            wins: increment(1),
          });
          // Loser gets +1 loss
          transaction.update(targetRef, {
            losses: increment(1),
          });
        } else if (result === 'target_won') {
          // Winner gets full refund + bonus points + 1 win
          transaction.update(targetRef, {
            points: increment(25), // Test version: just +25P bonus
            wins: increment(1),
          });
          // Loser gets +1 loss
          transaction.update(requesterRef, {
            losses: increment(1),
          });
        } else if (result === 'draw') {
          // Draw: Both get full refund
          const drawRefund = 50;
          transaction.update(requesterRef, {
            points: increment(drawRefund),
          });
          transaction.update(targetRef, {
            points: increment(drawRefund),
          });
        }
      });
    } catch (error) {
      console.error("Error completing match:", error);
      throw error;
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await runTransaction(db, async (transaction) => {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists()) throw new Error("Post not found");
        
        const post = postDoc.data();
        const currentLikes = Array.isArray(post.likes) ? post.likes : [];
        
        let newLikes;
        if (currentLikes.includes(user.uid)) {
          // Remove like
          newLikes = currentLikes.filter((id: string) => id !== user.uid);
        } else {
          // Add like
          newLikes = [...currentLikes, user.uid];
        }
        
        transaction.update(postRef, {
          likes: newLikes,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await runTransaction(db, async (transaction) => {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists()) throw new Error("Post not found");
        
        const post = postDoc.data();
        const currentComments = post.comments || [];
        
        const newComment = {
          id: Date.now().toString(), // Simple ID generation
          authorId: user.uid,
          content: content.trim(),
          createdAt: serverTimestamp(),
        };
        
        const newComments = [...currentComments, newComment];
        
        transaction.update(postRef, {
          comments: newComments,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  return {
    addDocument,
    updateDocument,
    deleteDocument,
    uploadFile,
    acceptMatch,
    rejectMatch,
    requestMatch,
    completeMatch,
    toggleLike,
    addComment,
  };

  async function requestMatch(requesterId: string, targetId: string, pointsCost: number = 0) {
    if (!user) throw new Error("User not authenticated");
    if (user.uid !== requesterId) throw new Error("Unauthorized: Only requester can create match");

    try {
      await runTransaction(db, async (transaction) => {
        const requesterRef = doc(db, 'users', requesterId);
        const requesterDoc = await transaction.get(requesterRef);
        
        if (!requesterDoc.exists()) throw new Error("Requester not found");
        
        // Test version: No points required or deducted
        const matchRef = doc(collection(db, 'matches'));
        transaction.set(matchRef, {
          id: matchRef.id,
          requesterId,
          targetId,
          status: 'pending',
          pointsCost: 0, // Test version: free matches
          isReviewed: false, // 기본값: 리뷰 미완료
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // Test version: No point deduction
        // transaction.update(requesterRef, {
        //   points: increment(-pointsCost),
        // });
      });
    } catch (error) {
      console.error("Error requesting match:", error);
      throw error;
    }
  }
}
