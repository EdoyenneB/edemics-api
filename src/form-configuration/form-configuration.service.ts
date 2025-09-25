// form-configuration/form-configuration.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FormConfigurationService {
  constructor(private prisma: PrismaService) {}

  async getFormConfiguration(tenantId: string) {
    let config = await this.prisma.formConfiguration.findUnique({
      where: { tenantId },
    });

    if (!config) {
      // Create default configuration if it doesn't exist
      const defaultConfig = this.getDefaultFormConfig();
      config = await this.prisma.formConfiguration.create({
        data: {
          config: defaultConfig,
          tenantId,
          isDefault: true,
        },
      });
    }

    return config.config;
  }

  async updateFormConfiguration(tenantId: string, data: any) {
    const config = await this.prisma.formConfiguration.findUnique({
      where: { tenantId },
    });

    if (config) {
      return this.prisma.formConfiguration.update({
        where: { tenantId },
        data: {
          config: data,
          isDefault: false, // Mark as custom configuration
          updatedAt: new Date(),
        },
      });
    } else {
      return this.prisma.formConfiguration.create({
        data: {
          config: data,
          tenantId,
          isDefault: false,
        },
      });
    }
  }

  async resetToDefault(tenantId: string) {
    const defaultConfig = this.getDefaultFormConfig();
    
    const config = await this.prisma.formConfiguration.upsert({
      where: { tenantId },
      update: {
        config: defaultConfig,
        isDefault: true,
        updatedAt: new Date(),
      },
      create: {
        config: defaultConfig,
        tenantId,
        isDefault: true,
      },
    });

    return config.config;
  }

    


  private getDefaultFormConfig() {
    // Return your complete default form configuration JSON
    return {
      "meta": {
        "createdAt": new Date().toISOString(),
        "isDefault": true
      },
      "tabs": [
        {
          "id": "tab1",
          "title": "Bio Data",
          "orientation": "horizontal",
          "sections": [
            {
              "id": "section1",
              "title": "Bio Data",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "column1",
                  "fields": [
                    {
                      "id": "admissionNumber",
                      "name": "admissionNumber",
                      "label": "Admission Number",
                      "isRequired": true,
                      "isReadOnly": true,
                      "isHidden": false,
                      "defaultValue": "ADM-2025-001",
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "firstName",
                      "name": "firstName",
                      "label": "First Name",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "lastName",
                      "name": "lastName",
                      "label": "Last Name",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "middleName",
                      "name": "middleName",
                      "label": "Middle Name",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "dateOfBirth",
                      "name": "dateOfBirth",
                      "label": "Date of Birth",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "file",
                      "name": "file_upload",
                      "label": "File Upload",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "gender",
                      "name": "gender",
                      "label": "Gender",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Male",
                        "Female",
                        "Other"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "age",
                      "name": "age",
                      "label": "Age",
                      "isRequired": false,
                      "isReadOnly": true,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "section",
                      "name": "section",
                      "label": "Section",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "A",
                        "B",
                        "C",
                        "D"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "religion",
                      "name": "religion",
                      "label": "Religion",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Christianity",
                        "Islam",
                        "Hinduism",
                        "Buddhism",
                        "Other"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "e1d18db9-80af-46fb-a783-b09e7670233e",
                      "name": "file_upload",
                      "label": "File Upload",
                      "type": "file",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                },
                {
                  "id": "f8a6d3fb-c64c-4d8e-ad5a-19985f11ed31",
                  "fields": [
                    {
                      "id": "class",
                      "name": "class",
                      "label": "Class",
                      "type": "linkfield",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "linkUrl": "academics/classsetup",
                      "linkText": "Manage Classes",
                      "description": "Click to add or edit classes",
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "classSelection",
                      "name": "classSelection",
                      "label": "Selected Class",
                      "type": "select",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "primary3",
                        "primary4"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "yearOfAdmission",
                      "name": "yearOfAdmission",
                      "label": "Year of Admission",
                      "type": "date",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "2025",
                        "2024",
                        "2023",
                        "2022",
                        "2021",
                        "2020"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "disability",
                      "name": "disability",
                      "label": "Disability (if any)",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "None",
                        "Visual",
                        "Hearing",
                        "Physical",
                        "Learning",
                        "Other"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "specialNeeds",
                      "name": "specialNeeds",
                      "label": "Special Educational Needs",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Yes",
                        "No"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "previousSchool",
                      "name": "previousSchool",
                      "label": "Previous School Attended",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "175f0537-f3b2-49c0-8bb8-dfb60b293ceb",
                      "name": "image",
                      "label": "Student Photo",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "2243198d-00d4-4d80-85c8-4056ca6412f2",
                      "name": "Enrollement date",
                      "label": "Enrollment Date",
                      "type": "date",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            },
            {
              "id": "3a9f4151-93b3-4848-832c-b2bb88dc5113",
              "title": "Address Section",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "3b359690-1470-4d0b-96aa-e4fc59a35a8d",
                  "fields": [
                    {
                      "id": "homeLanguage",
                      "name": "homeLanguage",
                      "label": "Home Language",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "state",
                      "name": "state",
                      "label": "State",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "postalCode",
                      "name": "postalCode",
                      "label": "Postal/Zip Code",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "lga",
                      "name": "lga",
                      "label": "Local Government Area",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "nationality",
                      "name": "nationality",
                      "label": "Nationality",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Nigeria",
                        "United States",
                        "United Kingdom",
                        "Canada",
                        "Other"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                },
                {
                  "id": "29531001-973c-457f-8f1a-a5ea783ea691",
                  "fields": [
                    {
                      "id": "city",
                      "name": "city",
                      "label": "City",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "country",
                      "name": "country",
                      "label": "Country",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Nigeria",
                        "United States",
                        "United Kingdom",
                        "Canada",
                        "Other"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "address",
                      "name": "address",
                      "label": "Residential Address",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "stateOfOrigin",
                      "name": "stateOfOrigin",
                      "label": "State of Origin",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "tab2",
          "title": "Parent/Guardian Information",
          "orientation": "horizontal",
          "sections": [
            {
              "id": "fatherSection",
              "title": "Father's Information",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "fatherColumn1",
                  "fields": [
                    {
                      "id": "fatherName",
                      "name": "fatherName",
                      "label": "Full Name",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "fatherEmail",
                      "name": "fatherEmail",
                      "label": "Email",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "fatherOfficeAddress",
                      "name": "fatherOfficeAddress",
                      "label": "Office Address",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "fatherOccupation",
                      "name": "fatherOccupation",
                      "label": "Occupation",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                },
                {
                  "id": "fatherColumn2",
                  "fields": [
                    {
                      "id": "fatherPhone",
                      "name": "fatherPhone",
                      "label": "Phone",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "fatherEducation",
                      "name": "fatherEducation",
                      "label": "Education Level",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Primary",
                        "Secondary",
                        "Diploma",
                        "Degree",
                        "Postgraduate"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "fatherCompany",
                      "name": "fatherCompany",
                      "label": "Company Name",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "fatherPhoto",
                      "name": "fatherPhoto",
                      "label": "Photo",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            },
            {
              "id": "motherSection",
              "title": "Mother's Information",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "motherColumn1",
                  "fields": [
                    {
                      "id": "motherName",
                      "name": "motherName",
                      "label": "Full Name",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "motherEmail",
                      "name": "motherEmail",
                      "label": "Email",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "motherOfficeAddress",
                      "name": "motherOfficeAddress",
                      "label": "Office Address",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "motherOccupation",
                      "name": "motherOccupation",
                      "label": "Occupation",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                },
                {
                  "id": "motherColumn2",
                  "fields": [
                    {
                      "id": "motherPhone",
                      "name": "motherPhone",
                      "label": "Phone",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "motherEducation",
                      "name": "motherEducation",
                      "label": "Education Level",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Primary",
                        "Secondary",
                        "Diploma",
                        "Degree",
                        "Postgraduate"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "motherCompany",
                      "name": "motherCompany",
                      "label": "Company Name",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "motherPhoto",
                      "name": "motherPhoto",
                      "label": "Photo",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            },
            {
              "id": "guardianSection",
              "title": "Guardian Information",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "guardianColumn1",
                  "fields": [
                    {
                      "id": "guardianName",
                      "name": "guardianName",
                      "label": "Full Name",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "guardianEmail",
                      "name": "guardianEmail",
                      "label": "Email",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "guardianAddress",
                      "name": "guardianAddress",
                      "label": "Address",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "guardianOccupation",
                      "name": "guardianOccupation",
                      "label": "Occupation",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                },
                {
                  "id": "guardianColumn2",
                  "fields": [
                    {
                      "id": "guardianPhone",
                      "name": "guardianPhone",
                      "label": "Phone",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "guardianRelationship",
                      "name": "guardianRelationship",
                      "label": "Relationship to Student",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Uncle",
                        "Aunt",
                        "Grandparent",
                        "Other"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "guardianPhoto",
                      "name": "guardianPhoto",
                      "label": "Photo",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            },
            {
              "id": "emergencySection",
              "title": "Emergency Contact",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "emergencyColumn1",
                  "fields": [
                    {
                      "id": "emergencyName",
                      "name": "emergencyName",
                      "label": "Contact Name",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "emergencyRelationship",
                      "name": "emergencyRelationship",
                      "label": "Relationship to Student",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                },
                {
                  "id": "emergencyColumn2",
                  "fields": [
                    {
                      "id": "emergencyPhone",
                      "name": "emergencyPhone",
                      "label": "Primary Phone",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "emergencyPhone2",
                      "name": "emergencyPhone2",
                      "label": "Alternate Phone",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "tab3",
          "title": "Medical Information",
          "orientation": "horizontal",
          "sections": [
            {
              "id": "medicalSection1",
              "title": "Medical Details",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "medicalColumn1",
                  "fields": [
                    {
                      "id": "bloodGroup",
                      "name": "bloodGroup",
                      "label": "Blood Group",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "A+",
                        "A-",
                        "B+",
                        "B-",
                        "AB+",
                        "AB-",
                        "O+",
                        "O-"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "genotype",
                      "name": "genotype",
                      "label": "Genotype",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "AA",
                        "AS",
                        "AC",
                        "SS",
                        "SC",
                        "CC"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "knownAllergies",
                      "name": "knownAllergies",
                      "label": "Known Allergies",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "allergyDetails",
                      "name": "allergyDetails",
                      "label": "Allergy Details",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "regularMedications",
                      "name": "regularMedications",
                      "label": "Regular Medications",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                },
                {
                  "id": "medicalColumn2",
                  "fields": [
                    {
                      "id": "chronicConditions",
                      "name": "chronicConditions",
                      "label": "Chronic Conditions",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "immunizationStatus",
                      "name": "immunizationStatus",
                      "label": "Immunization Up-to-date",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Yes",
                        "No",
                        "Partial"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "lastPhysicalExam",
                      "name": "lastPhysicalExam",
                      "label": "Last Physical Exam Date",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "physicalLimitations",
                      "name": "physicalLimitations",
                      "label": "Physical Limitations",
                      "isRequired":  false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            },
            {
              "id": "medicalSection2",
              "title": "Health Providers & Special Needs",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "healthColumn1",
                  "fields": [
                    {
                      "id": "doctorName",
                      "name": "doctorName",
                      "label": "Family Doctor Name",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry":  false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "doctorPhone",
                      "name": "doctorPhone",
                      "label": "Doctor's Phone",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "hospitalPreference",
                      "name": "hospitalPreference",
                      "label": "Preferred Hospital",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                },
                {
                  "id": "healthColumn2",
                  "fields": [
                    {
                      "id": "specialDiet",
                      "name": "specialDiet",
                      "label": "Special Dietary Needs",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "dietDetails",
                      "name": "dietDetails",
                      "label": "Diet Details",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "psychologicalConcerns",
                      "name": "psychologicalConcerns",
                      "label": "Psychological Concerns",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "tab4",
          "title": "Siblings Information",
          "orientation": "horizontal",
          "sections": [
            {
              "id": "siblingsSection",
              "title": "Siblings Details",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "siblingColumn1",
                  "fields": [
                    {
                      "id": "sibling1Name",
                      "name": "sibling1Name",
                      "label": "Sibling Name",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "sibling1Age",
                      "name": "sibling1Age",
                      "label": "Age",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "sibling1School",
                      "name": "sibling1School",
                      "label": "School/Institution",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "sibling1Relationship",
                      "name": "sibling1Relationship",
                      "label": "Relationship",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "options": [
                        "Brother",
                        "Sister",
                        "Half-brother",
                        "Half-sister",
                        "Step-brother",
                        "Step-sister"
                      ],
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            },
            {
              "id": "addSiblingSection",
              "title": "Add More Siblings",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "addSiblingColumn",
                  "fields": [
                    {
                      "id": "addSiblingButton",
                      "name": "addSiblingButton",
                      "label": "Add Another Sibling",
                      "type": "button",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "buttonAction": "addSibling",
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "tab5",
          "title": "Documents & Attachments",
          "orientation": "horizontal",
          "sections": [
            {
              "id": "documentsSection",
              "title": "Required Documents",
              "isCollapsed": false,
              "columns": [
                {
                  "id": "documentsColumn1",
                  "fields": [
                    {
                      "id": "birthCertificate",
                      "name": "birthCertificate",
                      "label": "Birth Certificate",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "immunizationRecords",
                      "name": "immunizationRecords",
                      "label": "Immunization Records",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "previousSchoolReport",
                      "name": "previousSchoolReport",
                      "label": "Previous School Report",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView":  false,
                      "inListFilter": false
                    }
                  ]
                },
                {
                  "id": "documentsColumn2",
                  "fields": [
                    {
                      "id": "medicalReport",
                      "name": "medicalReport",
                      "label": "Medical Report",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "parentIdProof",
                      "name": "parentIdProof",
                      "label": "Parent ID Proof",
                      "isRequired": true,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    },
                    {
                      "id": "otherDocuments",
                      "name": "otherDocuments",
                      "label": "Other Documents",
                      "isRequired": false,
                      "isReadOnly": false,
                      "isHidden": false,
                      "allowInQuickEntry": false,
                      "inListView": false,
                      "inListFilter": false
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "paymentGateways": [],
      "documentStates": [],
      "siblingTemplate": {
        "id": "siblingTemplate",
        "fields": [
          {
            "id": "siblingName",
            "name": "siblingName",
            "label": "Sibling Name",
            "isRequired": false,
            "isReadOnly": false,
            "isHidden": false,
            "allowInQuickEntry": false,
            "inListView": false,
            "inListFilter": false
          },
          {
            "id": "siblingAge",
            "name": "siblingAge",
            "label": "Age",
            "isRequired": false,
            "isReadOnly": false,
            "isHidden": false,
            "allowInQuickEntry": false,
            "inListView": false,
            "inListFilter": false
          },
          {
            "id": "siblingSchool",
            "name": "siblingSchool",
            "label": "School/Institution",
            "isRequired": false,
            "isReadOnly": false,
            "isHidden": false,
            "inListView": false,
            "inListFilter": false
          },
          {
            "id": "siblingRelationship",
            "name": "siblingRelationship",
            "label": "Relationship",
            "isRequired": false,
            "isReadOnly": false,
            "isHidden": false,
            "options": [
              "Brother",
              "Sister",
              "Half-brother",
              "Half-sister",
              "Step-brother",
              "Step-sister"
            ],
            "allowInQuickEntry": false,
            "inListView": false,
            "inListFilter": false
          }
        ]
      }
    };
  }
}