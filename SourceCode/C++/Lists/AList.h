/* ADT list - array-based implementation */

#ifndef ALIST_H
#define ALIST_H

#include <cstdlib>
#include "List.h"

using namespace std;

/* *** ODSATag: AList *** */
// Array-based list implementation
/* *** ODSATag: AListVars *** */
class AList : public List {
  ListItemType* listArray;            // Array holding list elements
  static const int DEFAULT_SIZE = 10; // Default size
  int maxSize;                        // Maximum size of list
  int listSize;                       // Current # of list items
  int curr;                           // Position of current element
/* *** ODSAendTag: AListVars *** */

public:
  // Constructors
  // Create a new list object with maximum size "size"
  AList(int size = DEFAULT_SIZE) : listSize(0), curr(0) {
    maxSize = size;
    listArray = new ListItemType[size];         // Create listArray
  }
  
  ~AList() { delete [] listArray; }      // destructor to remove array

  // Reinitialize the list
  void clear() { listSize = curr = 0; }  // Simply reinitialize values

/* *** ODSATag: AListInsert *** */
  // Insert "it" at current position
  bool insert(const ListItemType& it) {
    if (listSize >= maxSize) return false;
    for (int i = listSize; i > curr; i--)  // Shift elements up
      listArray[i] = listArray[i-1];       // to make room
    listArray[curr] = it;
    listSize++;                            // Increment list size
    return true;
  }
/* *** ODSAendTag: AListInsert *** */

/* *** ODSATag: AListAppend *** */
  // Append "it" to list
  bool append(const ListItemType& it) {
    if (listSize >= maxSize) return false;
    listArray[listSize++] = it;
    return true;
  }
/* *** ODSAendTag: AListAppend *** */

/* *** ODSATag: AListRemove *** */
  // Remove and return the current element
  // TODO should this be ListItemType& ? If so, remove cstdlib include
  ListItemType remove() {
  // TODO ListItemType& remove() {
    if ((curr < 0) || (curr >= listSize))  // No current element
      return (ListItemType)NULL;  // TODO discuss weird cast in text
      // TODO return &(new int(0)); // TODO messed up
    // TODO ListItemType* it = &listArray[curr];     // Copy the element
    ListItemType it = listArray[curr];     // Copy the element
    for(int i = curr; i < listSize-1; i++) // Shift them down
      listArray[i] = listArray[i+1];
    listSize--;                            // Decrement size
    return it;
  }
/* *** ODSAendTag: AListRemove *** */

  void moveToStart() { curr = 0; }       // Set to front
  void moveToEnd() { curr = listSize; }  // Set at end
  void prev() { if (curr != 0) curr--; } // Move left
  void next() { if (curr < listSize) curr++; } // Move right
  int length() { return listSize; }      // Return list size
  int currPos() { return curr; }         // Return current position

  // Set current list position to "pos"
  bool moveToPos(int pos) {
    if ((pos < 0) || (pos > listSize)) return false;
    curr = pos;
    return true;
  }

  // Return true if current position is at end of the list
  bool isAtEnd() { return curr == listSize; }

  // Return the current element
  // TODO & ? above
  ListItemType getValue() {
    if ((curr < 0) || (curr >= listSize)) // No current element
      return (ListItemType)NULL;
    return listArray[curr];
  }
  
  // Check if the list is empty
  bool isEmpty() { return listSize == 0; }
  
  // Give a string representation of the list
  string toString() {
    string out;

    out.append("< ");                         // Surrounded by < >
    for (int i = 0; i < curr; i++) {          // items before current
      out.append( to_string(listArray[i]) );
      out.append(" ");
    }
    out.append("| ");                         // current location as |
    for (int i = curr; i < listSize; i++) {   // items after current
      out.append( to_string(listArray[i]) );  // TODO note in text only works for numeric types in C11 onward
      out.append(" ");
    }
    out.append(">");
    return out;
  }
};
/* *** ODSAendTag: AList *** */

#endif /* ALIST_H */
