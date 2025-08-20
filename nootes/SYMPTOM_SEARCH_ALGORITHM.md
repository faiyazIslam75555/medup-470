# 🔍 Symptom Search Algorithm & Triage System Documentation

## 📋 Overview

The symptom search system allows patients to find appropriate doctors based on their medical symptoms. This document explains the algorithm, data structure, and flow of the triage system.

## 🏗️ System Architecture

### **Current Implementation: 5-File System**
```
server/config/triage/
├── symptoms.json              # Master symptom list
├── synonyms.json              # Alternative symptom names
├── symptom_specialty_matrix.json  # Symptom → Specialty mapping
├── symptom_weights.json       # Symptom importance scoring
└── red_flag_combos.json      # Dangerous symptom combinations
```

### **Why 5 Files? (Current Complexity)**
The system was designed to be a **comprehensive medical triage AI**, but this creates unnecessary complexity for a basic hospital management system.

## 🔄 Algorithm Flow

### **Step 1: Symptom Input & Suggestions**
```javascript
// Patient types symptom → Get suggestions
GET /api/triage/symptoms?query=headache

// Algorithm: Fuzzy search with synonyms
1. Check direct matches in symptoms.json
2. Search synonyms.json for alternatives
3. Return matching symptoms with relevance scoring
```

### **Step 2: Symptom Selection & Analysis**
```javascript
// Patient selects symptoms → System analyzes
POST /api/triage/search
Body: { symptoms: ["headache", "fever", "nausea"] }

// Algorithm: Multi-symptom analysis
1. Look up each symptom in symptom_specialty_matrix.json
2. Calculate specialty scores using symptom_weights.json
3. Check for red_flag_combos.json (dangerous combinations)
4. Determine primary and secondary specialties
```

### **Step 3: Doctor Matching**
```javascript
// Find doctors by recommended specialty
GET /api/doctor/search?specialty=Neurology

// Algorithm: Doctor availability matching
1. Find doctors in recommended specialty
2. Check available time slots
3. Return doctors with appointment availability
```

## 📊 Data Structure Analysis

### **1. symptoms.json**
```json
{
  "headache": {
    "id": "symptom_001",
    "category": "neurological",
    "severity": "medium"
  }
}
```

### **2. synonyms.json**
```json
{
  "headache": ["head pain", "cephalalgia", "migraine"],
  "chest pain": ["chest discomfort", "heart pain", "angina"]
}
```

### **3. symptom_specialty_matrix.json**
```json
{
  "headache": {
    "primary": "Neurology",
    "secondary": ["General Medicine", "Emergency Medicine"],
    "confidence": 0.85
  }
}
```

### **4. symptom_weights.json**
```json
{
  "headache": 0.6,
  "chest pain": 0.9,
  "fever": 0.7
}
```

### **5. red_flag_combos.json**
```json
{
  "sudden_severe_headache": {
    "symptoms": ["sudden headache", "severe pain"],
    "urgency": "immediate",
    "specialty": "Emergency Medicine"
  }
}
```

## 🎯 Current Algorithm Logic

### **Symptom Scoring Algorithm:**
```javascript
function calculateSpecialtyScore(symptoms) {
  let specialtyScores = {};
  
  symptoms.forEach(symptom => {
    const specialty = symptom_specialty_matrix[symptom];
    const weight = symptom_weights[symptom];
    
    if (specialty.primary) {
      specialtyScores[specialty.primary] += weight * specialty.confidence;
    }
  });
  
  return Object.entries(specialtyScores)
    .sort(([,a], [,b]) => b - a);
}
```

### **Red Flag Detection:**
```javascript
function checkRedFlags(symptoms) {
  const redFlags = [];
  
  Object.keys(red_flag_combos).forEach(combo => {
    if (symptoms.includes(combo.symptoms)) {
      redFlags.push({
        combo: combo,
        urgency: combo.urgency,
        recommendedSpecialty: combo.specialty
      });
    }
  });
  
  return redFlags;
}
```

## ❌ Problems with Current System

### **1. Over-Engineering**
- **5 separate files** for what could be 1-2 files
- **Complex scoring algorithms** not needed for basic matching
- **Red flag detection** adds unnecessary complexity

### **2. Maintenance Issues**
- **Data duplication** across multiple files
- **Update nightmare** - changing symptoms requires 5 file updates
- **Version control conflicts** with multiple related files

### **3. Performance Issues**
- **Multiple file reads** for each search
- **Complex calculations** slow down response time
- **Memory overhead** from loading 5 separate data structures

## 🚀 Simplified Algorithm (Recommended)

### **Single File Approach:**
```json
// symptoms.json - All data in one place
{
  "headache": {
    "specialty": "Neurology",
    "synonyms": ["head pain", "migraine", "cephalalgia"],
    "severity": "medium",
    "red_flags": ["sudden severe", "with fever", "with confusion"]
  },
  "chest pain": {
    "specialty": "Cardiology",
    "synonyms": ["chest discomfort", "heart pain"],
    "severity": "high",
    "red_flags": ["crushing pain", "radiating to arm"]
  }
}
```

### **Simplified Algorithm:**
```javascript
function findDoctorBySymptoms(symptoms) {
  // 1. Look up symptoms (single file lookup)
  const symptomData = symptoms.map(s => symptoms[s]);
  
  // 2. Get specialties (simple mapping)
  const specialties = [...new Set(symptomData.map(s => s.specialty))];
  
  // 3. Find doctors by primary specialty
  const primarySpecialty = specialties[0];
  const doctors = await findDoctorsBySpecialty(primarySpecialty);
  
  return {
    recommendedSpecialty: primarySpecialty,
    alternativeSpecialty: specialties[1] || null,
    availableDoctors: doctors
  };
}
```

## 📈 Performance Comparison

### **Current System (5 Files):**
- **File Reads**: 5 separate file operations
- **Memory Usage**: 5 data structures loaded
- **Search Time**: Complex scoring calculations
- **Response Time**: ~200-500ms

### **Simplified System (1 File):**
- **File Reads**: 1 file operation
- **Memory Usage**: 1 data structure
- **Search Time**: Simple key-value lookup
- **Response Time**: ~50-100ms

## 🔧 Implementation Recommendations

### **Phase 1: Simplify Data Structure**
1. **Merge all data** into single `symptoms.json`
2. **Remove complex scoring** algorithms
3. **Keep essential features**: synonyms, specialties, basic severity

### **Phase 2: Streamline Algorithm**
1. **Single lookup** instead of 5 file searches
2. **Direct specialty mapping** without weights
3. **Simple doctor search** by specialty

### **Phase 3: Add Advanced Features (Optional)**
1. **Symptom severity** for emergency triage
2. **Red flag detection** for critical symptoms
3. **Confidence scoring** for specialty matching

## 📋 Current API Endpoints

### **Symptom Suggestions:**
```http
GET /api/triage/symptoms?query=headache
Response: ["headache", "migraine", "tension headache"]
```

### **Doctor Search:**
```http
POST /api/triage/search
Body: { symptoms: ["headache", "fever"] }
Response: {
  "recommendedSpecialty": "Neurology",
  "alternativeSpecialty": "General Medicine",
  "recommendedDoctors": [...],
  "availableSlots": [...]
}
```

## 🎯 What the System Actually Does

### **Patient Experience:**
1. **Patient types symptoms** → Gets auto-suggestions
2. **Patient selects symptoms** → System analyzes
3. **System recommends specialty** → Based on symptom mapping
4. **Shows available doctors** → In recommended specialty
5. **Patient books appointment** → With preferred doctor

### **Core Functionality:**
- ✅ **Symptom input** with auto-suggestions
- ✅ **Specialty recommendation** based on symptoms
- ✅ **Doctor matching** by medical specialty
- ✅ **Appointment booking** with available slots

## 🚨 Conclusion

### **Current State:**
- **Over-engineered** with 5 separate files
- **Complex algorithms** not needed for basic functionality
- **Performance overhead** from multiple file operations

### **Recommended Approach:**
- **Simplify to 1-2 files** for easier maintenance
- **Streamline algorithm** for faster response times
- **Focus on core functionality** rather than medical AI features

### **For Basic Hospital Management:**
The current system provides **excellent functionality** but could be **significantly simplified** without losing any core features. A single file with symptom-to-specialty mapping would be sufficient for most use cases.

---

**Note**: This documentation explains the current complex system. Consider implementing the simplified version for better performance and maintainability.
