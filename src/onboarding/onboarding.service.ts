// onboarding.service.ts (updated for your schema)
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

   private extractId(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.id) return value.id;
    if (typeof value === 'object' && value.name) return value.name; // Fallback to name
    return null;
  }

  // Helper function to extract name from object or string
  private extractName(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.name) return value.name;
    return null;
  }


  // School Details
  async getSchoolDetails(tenantId: string) {
    return this.prisma.school.findFirst({
      where: { tenantId },
    });
  }

  async saveSchoolDetails(tenantId: string, data: any) {
    let school = await this.prisma.school.findFirst({
      where: { tenantId },
    });

    const schoolData = {
      name: data.name,
      address: data.address,
      email: data.email,
      phone: data.phone,
      academicYear: data.academicYear,
      country: data.country,
      logo: data.logo === "null" ? null : data.logo,
      tenantId,
    };

    if (school) {
      return this.prisma.school.update({
        where: { id: school.id },
        data: schoolData,
      });
    } else {
      return this.prisma.school.create({
        data: schoolData,
      });
    }
  }

  // Branches
  async getBranches(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      include: { 
        school: true,
        departments: true 
      },
    }); 
  }

  async saveBranches(tenantId: string, branches: any[]) {
  const school = await this.prisma.school.findFirst({
    where: { tenantId },
  });

  if (!school) {
    throw new NotFoundException('School not found for this tenant');
  }

  // Delete existing branches
  await this.prisma.branch.deleteMany({
    where: { tenantId },
  });

  // Create new branches with admin users
  const createdBranches = await Promise.all(
    branches.map(async (branch, index) => {
      const { admin, ...branchData } = branch;
      
      // Create branch
      const createdBranch = await this.prisma.branch.create({
        data: {
          ...branchData,
          isHeadOffice: index === 0, // First branch is head office
          schoolId: school.id,
          tenantId,
        },
      });

      // Create admin user if admin data is provided
      if (admin && admin.email && admin.password) {
        try {
          const hashedPassword = await bcrypt.hash(admin.password, 10);
          
          // Check if user already exists
          const existingUser = await this.prisma.user.findUnique({
            where: { email: admin.email },
          });

          if (existingUser) {
            // Update existing user
            await this.prisma.user.update({
              where: { email: admin.email },
              data: {
                name: admin.name || 'Branch Admin',
                password: hashedPassword,
                role: 'branch-admin',
                tenantId,
                branchId: createdBranch.id, // Link user to branch
              },
            });
          } else {
            // Create new user
            await this.prisma.user.create({
              data: {
                email: admin.email,
                password: hashedPassword,
                name: admin.name || 'Branch Admin',
                role: 'branch-admin',
                tenantId,
                branchId: createdBranch.id, // Link user to branch
              },
            });
          }
        } catch (error) {
          console.error('Failed to create/admin user for branch:', error);
          // Continue without failing the whole operation
        }
      }

      return createdBranch;
    }),
  );

  return createdBranches;
}

  // Organogram (Departments)
 async getDepartments(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: {
        parentDepartment: true,
        childDepartments: true,
        employees: true,
        branch: true,
        school: true,
        classes: true, // Include linked classes
      },
    });
  }
  // onboarding.service.ts - FIXED syncDepartmentsToClasses method
private async syncDepartmentsToClasses(tenantId: string) {
  // ONLY get CLASS type departments
  const classDepartments = await this.prisma.department.findMany({
    where: { 
      tenantId,
      type: 'CLASS' // ONLY CLASS type
    },
    include: {
      branch: true,
      classes: true
    }
  });

  const school = await this.prisma.school.findFirst({
    where: { tenantId },
  });

  if (!school) return;

  // Get existing classes
  const existingClasses = await this.prisma.class.findMany({
    where: { tenantId },
    include: { sections: true }
  });

  // Create or update classes for CLASS departments only
  for (const dept of classDepartments) {
    const existingClass = existingClasses.find(cls => cls.name === dept.name);
    
    if (!existingClass) {
      // Create new class for this CLASS department
      const classData: any = {
        name: dept.name,
        department: dept.name,
        departmentId: dept.id,
        tenantId,
        sections: {
          create: [
            {
              name: "A", // Default section
              capacity: "30",
              teacher: "",
              assistantTeacher: "",
              building: "",
              floor: "",
              wing: "",
              tenantId,
            }
          ]
        }
      };

      // Only add branch if it exists
      if (dept.branchId) {
        classData.branchId = dept.branchId;
      }

      await this.prisma.class.create({
        data: classData,
      });
    } else if (existingClass.branchId !== dept.branchId || existingClass.departmentId !== dept.id) {
      // Update class if branch or department changed
      const updateData: any = {};
      
      if (existingClass.branchId !== dept.branchId) {
        if (dept.branchId) {
          updateData.branch = { connect: { id: dept.branchId } };
        } else {
          updateData.branch = { disconnect: true };
        }
      }
      
      if (existingClass.departmentId !== dept.id) {
        updateData.departmentRel = { connect: { id: dept.id } };
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.class.update({
          where: { id: existingClass.id },
          data: updateData,
        });
      }
    }
  }

  // Remove classes for deleted CLASS departments
  const currentDepartmentNames = classDepartments.map(dept => dept.name);
  const classesToRemove = existingClasses.filter(
    cls => !currentDepartmentNames.includes(cls.name)
  );

  for (const cls of classesToRemove) {
    await this.prisma.class.delete({
      where: { id: cls.id },
    });
  }
}



// onboarding.service.ts - saveDepartments method
// onboarding.service.ts - FIXED saveDepartments method
 async saveDepartments(tenantId: string, departments: any[]) {
    const school = await this.prisma.school.findFirst({
      where: { tenantId },
    });

    if (!school) {
      throw new NotFoundException('School not found for this tenant');
    }

    // Delete existing departments
    await this.prisma.department.deleteMany({
      where: { tenantId },
    });

    const departmentMap = new Map();
    
    // First pass: create all departments without parent references
    for (const dept of departments) {
      const { parentDepartment, branchId, ...deptData } = dept;
      
      // Extract branch ID from object or string
      const extractedBranchId = this.extractId(branchId);

      // Find branch if branchId is provided and not "none"
      let branch = null;
      if (extractedBranchId && extractedBranchId !== "none") {
        branch = await this.prisma.branch.findFirst({
          where: { 
            OR: [
              { id: extractedBranchId },
              { name: extractedBranchId }
            ],
            tenantId 
          },
        });
      }

      // Convert string type to enum and set academic flag
      const departmentType = this.mapDepartmentType(dept.type);
      const isAcademic = departmentType === 'CLASS' ? true : dept.isAcademic;

      const createdDept = await this.prisma.department.create({
        data: {
          name: deptData.name,
          isAcademic,
          type: departmentType,
          schoolId: school.id,
          tenantId,
          branchId: branch ? branch.id : null,
          parentDepartmentId: null, // Set to null initially
        },
      });
      
      // Store mapping using the department name as key
      departmentMap.set(dept.name, createdDept.id);
    }

    // Second pass: update parent-child relationships
    for (const dept of departments) {
      // Extract parent department name from object or string
      let parentDeptName: string | null = null;
      
      if (dept.parentDepartment && dept.parentDepartment !== "none") {
        parentDeptName = this.extractName(dept.parentDepartment);
      }

      if (parentDeptName) {
        const currentDeptId = departmentMap.get(dept.name);
        const parentDeptId = departmentMap.get(parentDeptName);
        
        if (parentDeptId && currentDeptId) {
          await this.prisma.department.update({
            where: { id: currentDeptId },
            data: { parentDepartmentId: parentDeptId },
          });
        }
      }
    }

    // ONLY sync CLASS departments to classes
    await this.syncDepartmentsToClasses(tenantId);

    return this.getDepartments(tenantId);
  }


// Helper to map string types to enum
private mapDepartmentType(type: string) {
    switch (type?.toUpperCase()) {
      case 'PARENT': return 'PARENT';
      case 'DEPARTMENT': return 'DEPARTMENT';
      case 'SUB': return 'SUB';
      case 'CLASS': return 'CLASS';
      default: return 'DEPARTMENT';
    }
  }


  // Employees
  async getEmployees(tenantId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId },
      include: {
        department: true,
        branch: true,
        class: true,
      },
    });
  }

async saveEmployees(tenantId: string, employees: any[]) {
    // Delete existing employees
    await this.prisma.employee.deleteMany({
      where: { tenantId },
    });

    // Create new employees
    const createdEmployees = await Promise.all(
      employees.map(async (employee) => {
        const { 
          department, 
          branch, 
          class: classData, 
          employeeId, 
          customDepartment,
          customSubDepartment,
          subDepartment,
          ...empData 
        } = employee;
        
        // Extract IDs from objects
        const departmentId = this.extractId(department);
        const branchId = this.extractId(branch);
        const classId = this.extractId(classData);

        // Find related entities
        let departmentRecord = null;
        if (departmentId && departmentId !== "other") {
          departmentRecord = await this.prisma.department.findFirst({
            where: { 
              OR: [
                { id: departmentId },
                { name: departmentId }
              ],
              tenantId 
            },
          });
        }

        let branchRecord = null;
        if (branchId && branchId !== "none") {
          branchRecord = await this.prisma.branch.findFirst({
            where: { 
              OR: [
                { id: branchId },
                { name: branchId }
              ],
              tenantId 
            },
          });
        }

        let classRecord = null;
        if (classId) {
          classRecord = await this.prisma.class.findFirst({
            where: { 
              OR: [
                { id: classId },
                { name: classId }
              ],
              tenantId 
            },
          });
        }

        // Use custom department name if provided
        const finalDepartmentName = departmentId === "other" ? customDepartment : departmentId;

        return this.prisma.employee.create({
          data: {
            ...empData,
            employeeId: employeeId || `EMP${Date.now()}`,
            departmentId: departmentRecord ? departmentRecord.id : null,
            branchId: branchRecord ? branchRecord.id : null,
            classId: classRecord ? classRecord.id : null,
            subDepartment: subDepartment === "other" ? customSubDepartment : subDepartment,
            customDepartment: departmentId === "other" ? customDepartment : null,
            customSubDepartment: subDepartment === "other" ? customSubDepartment : null,
            tenantId,
          },
          include: {
            department: true,
            branch: true,
            class: true,
          },
        });
      }),
    );

    return createdEmployees;
  }





  // Classes & Sections
  async getClasses(tenantId: string) {
    return this.prisma.class.findMany({
      where: { tenantId },
      include: {
        sections: true,
        branch: true,
       
      },
    });
  }
  private async syncClassDepartments(tenantId: string) {
    const classes = await this.prisma.class.findMany({
      where: { tenantId },
      include: { departmentRel: true }
    });

    const school = await this.prisma.school.findFirst({
      where: { tenantId },
    });

    if (!school) return;

    // Get existing CLASS departments only
    const existingClassDepartments = await this.prisma.department.findMany({
      where: { 
        tenantId,
        type: 'CLASS' // ONLY CLASS type
      }
    });

    // Create or update CLASS departments for classes
    for (const cls of classes) {
      const existingDept = existingClassDepartments.find(dept => dept.name === cls.name);
      
      if (!existingDept) {
        // Create new CLASS department for this class
        await this.prisma.department.create({
          data: {
            name: cls.name,
            isAcademic: true,
            type: 'CLASS', // Set as CLASS type
            schoolId: school.id,
            tenantId,
            branchId: cls.branchId,
          },
        });
      } else if (existingDept.branchId !== cls.branchId) {
        // Update branch if changed
        await this.prisma.department.update({
          where: { id: existingDept.id },
          data: { branchId: cls.branchId },
        });
      }
    }

    // Remove CLASS departments for deleted classes
    const currentClassNames = classes.map(cls => cls.name);
    const departmentsToRemove = existingClassDepartments.filter(
      dept => !currentClassNames.includes(dept.name)
    );

    for (const dept of departmentsToRemove) {
      await this.prisma.department.delete({
        where: { id: dept.id },
      });
    }
  }


// onboarding.service.ts - FIXED saveClasses method
async saveClasses(tenantId: string, classes: any[]) {
  const school = await this.prisma.school.findFirst({
    where: { tenantId },
  });

  if (!school) {
    throw new NotFoundException('School not found for this tenant');
  }

  // Delete existing classes and sections
  await this.prisma.section.deleteMany({
    where: { tenantId },
  });
  
  await this.prisma.class.deleteMany({
    where: { tenantId },
  });

  // Create new classes with sections and department links
  const createdClasses = await Promise.all(
    classes.map(async (cls) => {
      const { sections, department, branch, ...classData } = cls;
      
      // Extract department ID/name from object or string
      const departmentIdOrName = this.extractId(department);
      const departmentName = this.extractName(department);

      // Find or create department for the class
      let departmentRecord = null;
      if (departmentIdOrName) {
        // First try to find existing department with this name and type CLASS
        departmentRecord = await this.prisma.department.findFirst({
          where: { 
            OR: [
              { id: departmentIdOrName },
              { name: departmentIdOrName }
            ],
            tenantId,
            type: 'CLASS'
          },
        });

        // If no department found, create one for the class
        if (!departmentRecord) {
          departmentRecord = await this.prisma.department.create({
            data: {
              name: departmentName || classData.name,
              isAcademic: true, // Classes are always academic
              type: 'CLASS',
              schoolId: school.id,
              tenantId,
              branchId: null,
            },
          });
        }
      } else {
        // If no department specified, create one with the class name
        departmentRecord = await this.prisma.department.findFirst({
          where: { 
            name: classData.name,
            tenantId,
            type: 'CLASS'
          },
        });

        if (!departmentRecord) {
          departmentRecord = await this.prisma.department.create({
            data: {
              name: classData.name,
              isAcademic: true,
              type: 'CLASS',
              schoolId: school.id,
              tenantId,
              branchId: null,
            },
          });
        }
      }

      // Extract branch ID from object or string
      const branchId = this.extractId(branch);

      // Prepare class data
      const classCreateData: any = {
        ...classData,
        department: departmentRecord.name,
        departmentId: departmentRecord.id,
        tenantId,
      };

      // Only add branch if it exists and is not "none"
      if (branchId && branchId !== "none") {
        const branchRecord = await this.prisma.branch.findFirst({
          where: { 
            OR: [
              { id: branchId },
              { name: branchId }
            ],
            tenantId 
          },
        });
        
        if (branchRecord) {
          classCreateData.branchId = branchRecord.id;
        }
      }

      // Create the class record
      const createdClass = await this.prisma.class.create({
        data: classCreateData,
      });

      // Create sections
      if (sections && sections.length > 0) {
        await Promise.all(
          sections.map(async (section) => {
            const { teacher, assistantTeacher, customTeacher, customAssistantTeacher, ...sectionData } = section;
            
            // Extract teacher IDs from objects if needed
            const finalTeacher = teacher === "other" ? customTeacher : this.extractId(teacher);
            const finalAssistantTeacher = assistantTeacher === "other" ? customAssistantTeacher : this.extractId(assistantTeacher);

            return this.prisma.section.create({
              data: {
                ...sectionData,
                teacher: finalTeacher,
                assistantTeacher: finalAssistantTeacher,
                customTeacher: teacher === "other" ? customTeacher : null,
                customAssistantTeacher: assistantTeacher === "other" ? customAssistantTeacher : null,
                classId: createdClass.id,
                tenantId,
              },
            });
          }),
        );
      } else {
        // Create a default section if no sections provided
        await this.prisma.section.create({
          data: {
            name: "A",
            capacity: "30",
            teacher: "",
            assistantTeacher: "",
            building: "",
            floor: "",
            wing: "",
            classId: createdClass.id,
            tenantId,
          },
        });
      }

      return this.prisma.class.findUnique({
        where: { id: createdClass.id },
        include: { 
          sections: true,
          departmentRel: true,
          branch: true 
        },
      });
    }),
  );

  return createdClasses;
}



  // Subjects
  async getSubjects(tenantId: string) {
    return this.prisma.subject.findMany({
      where: { tenantId },
      include: {
        class: true,
        section: true,
      },
    });
  }

// onboarding.service.ts - saveSubjects method
// onboarding.service.ts - saveSubjects method
// onboarding.service.ts - saveSubjects method
// onboarding.service.ts - saveSubjects method
// onboarding.service.ts - FIXED saveSubjects method
async saveSubjects(tenantId: string, subjects: any[]) {
  // Delete existing subjects
  await this.prisma.subject.deleteMany({
    where: { tenantId },
  });

  // Create new subjects
  const createdSubjects = await Promise.all(
    subjects.map(async (subject) => {
      const { 
        class: className, 
        section: sectionName, 
        customTeacher, 
        customAssistantTeacher, 
        ...cleanSubjectData 
      } = subject;
      
      // Extract class ID or name
      let classIdOrName: string | null = null;
      if (className) {
        classIdOrName = typeof className === 'object' ? (className.id || className.name) : className;
      }
      
      // Extract section ID or name  
      let sectionIdOrName: string | null = null;
      if (sectionName) {
        sectionIdOrName = typeof sectionName === 'object' ? (sectionName.id || sectionName.name) : sectionName;
      }

      // Find class - THIS IS REQUIRED
      let classRecord = null;
      if (classIdOrName) {
        classRecord = await this.prisma.class.findFirst({
          where: { 
            OR: [
              { id: classIdOrName },
              { name: classIdOrName }
            ],
            tenantId 
          },
        });
      }

      // If no class found, we cannot create the subject
      if (!classRecord) {
        throw new Error(`Class not found for subject: ${cleanSubjectData.name}. Please select a valid class.`);
      }

      // Find section (optional)
      let sectionRecord = null;
      if (sectionIdOrName && classRecord) {
        sectionRecord = await this.prisma.section.findFirst({
          where: { 
            OR: [
              { id: sectionIdOrName },
              { name: sectionIdOrName }
            ],
            classId: classRecord.id,
            tenantId 
          },
        });
      }

      // Validate teachers are academic employees if not custom
      let finalTeacher = cleanSubjectData.teacher;
      let finalAssistantTeacher = cleanSubjectData.assistantTeacher;

      if (cleanSubjectData.teacher && cleanSubjectData.teacher !== "other") {
        const teacherEmployee = await this.prisma.employee.findFirst({
          where: {
            OR: [
              { id: cleanSubjectData.teacher },
              { employeeId: cleanSubjectData.teacher },
              { name: cleanSubjectData.teacher }
            ],
            tenantId,
            department: {
              isAcademic: true
            }
          },
        });

        if (!teacherEmployee) {
          throw new Error(`Teacher ${cleanSubjectData.teacher} is not a valid academic employee`);
        }
      }

      if (cleanSubjectData.assistantTeacher && cleanSubjectData.assistantTeacher !== "other") {
        const assistantEmployee = await this.prisma.employee.findFirst({
          where: {
            OR: [
              { id: cleanSubjectData.assistantTeacher },
              { employeeId: cleanSubjectData.assistantTeacher },
              { name: cleanSubjectData.assistantTeacher }
            ],
            tenantId,
            department: {
              isAcademic: true
            }
          },
        });

        if (!assistantEmployee) {
          throw new Error(`Assistant teacher ${cleanSubjectData.assistantTeacher} is not a valid academic employee`);
        }
      }

      return this.prisma.subject.create({
        data: {
          ...cleanSubjectData,
          teacher: finalTeacher === "other" ? customTeacher : finalTeacher,
          assistantTeacher: finalAssistantTeacher === "other" ? customAssistantTeacher : finalAssistantTeacher,
          customTeacher: finalTeacher === "other" ? customTeacher : null,
          customAssistantTeacher: finalAssistantTeacher === "other" ? customAssistantTeacher : null,
          classId: classRecord.id, // REQUIRED - cannot be null
          sectionId: sectionRecord ? sectionRecord.id : null, // Optional
          tenantId,
        },
        include: {
          class: true,
          section: true,
        },
      });
    }),
  );

  return createdSubjects;
}

  // Students & Parents
  async getStudents(tenantId: string) {
    return this.prisma.student.findMany({
      where: { tenantId },
      include: {
        class: true,
        section: true,
        parentStudents: {
          include: {
            parent: true,
          },
        },
      },
    });
  }

  async getParents(tenantId: string) {
    return this.prisma.parent.findMany({
      where: { tenantId },
      include: {
        parentStudents: {
          include: {
            student: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });
  }

  // src/onboarding/onboarding.service.ts
// src/onboarding/onboarding.service.ts
// src/onboarding/onboarding.service.ts

// src/onboarding/onboarding.service.ts

// src/onboarding/onboarding.service.ts

// src/onboarding/onboarding.service.ts

// src/onboarding/onboarding.service.ts

// src/onboarding/onboarding.service.ts - saveStudentsAndParents method
// src/onboarding/onboarding.service.ts - saveStudentsAndParents method

// src/onboarding/onboarding.service.ts - FIXED saveStudentsAndParents method
// src/onboarding/onboarding.service.ts - FIXED saveStudentsAndParents method
async saveStudentsAndParents(tenantId: string, data: { students: any[]; parents: any[] }) {
  const { students, parents } = data;
  
  try {
    // Delete existing parent-student relationships first
    await this.prisma.parentStudent.deleteMany({
      where: { tenantId },
    });
    
    // Then delete students and parents
    await this.prisma.student.deleteMany({
      where: { tenantId },
    });
    
    await this.prisma.parent.deleteMany({
      where: { tenantId },
    });

    // First, create all parents (we need parent IDs for student creation)
    const parentMap = new Map();
    for (const parent of parents) {
      const { students: studentIds, ...parentData } = parent;
      
      const createdParent = await this.prisma.parent.create({
        data: {
          ...parentData,
          tenantId,
        },
      });
      parentMap.set(parent.id || createdParent.id, createdParent);
    }

    // Then, create students with proper parentStudents relation
    const studentMap = new Map();
    for (const student of students) {
      const { parents: parentIds, class: className, section: sectionName, ...studentData } = student;
      
      // Convert class name to classId if provided
      let classIdToUse = studentData.classId || null;
      let sectionIdToUse = studentData.sectionId || null;

      // If class name is provided but classId is not, try to find the class
      if (className && !classIdToUse) {
        const classRecord = await this.prisma.class.findFirst({
          where: { 
            name: className,
            tenantId 
          },
        });
        if (classRecord) {
          classIdToUse = classRecord.id;
          
          // If section name is provided, try to find the section
          if (sectionName && !sectionIdToUse) {
            const sectionRecord = await this.prisma.section.findFirst({
              where: { 
                name: sectionName,
                classId: classRecord.id,
                tenantId 
              },
            });
            if (sectionRecord) {
              sectionIdToUse = sectionRecord.id;
            }
          }
        }
      }

      // Create parentStudents connections for this student
      const parentStudentConnections = [];
      if (parentIds && parentIds.length > 0) {
        for (const parentId of parentIds) {
          const parent = parentMap.get(parentId);
          if (parent) {
            parentStudentConnections.push({
              parentId: parent.id,
              tenantId,
            });
          }
        }
      }

      // Create student WITH proper parentStudents relation
      const createdStudent = await this.prisma.student.create({
        data: {
          ...studentData,
          classId: classIdToUse,
          sectionId: sectionIdToUse,
          tenantId,
          parentStudents: {
            create: parentStudentConnections
          }
        },
        include: {
          class: true,
          section: true,
          parentStudents: {
            include: {
              parent: true,
            },
          },
        },
      });
      studentMap.set(student.id || createdStudent.id, createdStudent);
    }

    // Fetch the final data
    const finalStudents = await this.prisma.student.findMany({
      where: { tenantId },
      include: {
        class: true,
        section: true,
        parentStudents: {
          include: {
            parent: true,
          },
        },
      },
    });

    const finalParents = await this.prisma.parent.findMany({
      where: { tenantId },
      include: {
        parentStudents: {
          include: {
            student: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });

    return {
      students: finalStudents,
      parents: finalParents,
    };
  } catch (error) {
    console.error('Error in saveStudentsAndParents:', error);
    throw error;
  }
}

  // Sessions
  async getSessions(tenantId: string) {
    return this.prisma.session.findMany({
      where: { tenantId },
      include: {
        branch: true,
      },
    });
  }

  async saveSessions(tenantId: string, sessions: any[]) {
    // Delete existing sessions
    await this.prisma.session.deleteMany({
      where: { tenantId },
    });

    // Create new sessions
    const createdSessions = await Promise.all(
      sessions.map(async (session) => {
        const { branch: branchName, ...sessionData } = session;
        
        // Find branch
        let branchRecord = null;
        if (branchName) {
          branchRecord = await this.prisma.branch.findFirst({
            where: { 
              OR: [
                { id: branchName },
                { name: branchName }
              ],
              tenantId 
            },
          });
        }

        return this.prisma.session.create({
          data: {
            ...sessionData,
            branchId: branchRecord ? branchRecord.id : null,
            tenantId,
          },
          include: {
            branch: true,
          },
        });
      }),
    );

    return createdSessions;
  }

  // Notifications
  async getNotifications(tenantId: string) {
    const school = await this.prisma.school.findFirst({
      where: { tenantId },
    });

    if (!school) {
      return null;
    }

    return this.prisma.notificationSettings.findFirst({
      where: {
        schoolId: school.id,
        tenantId,
      },
    });
  }

  async saveNotifications(tenantId: string, data: any) {
    const school = await this.prisma.school.findFirst({
      where: { tenantId },
    });

    if (!school) {
      throw new NotFoundException('School not found for this tenant');
    }

    let notificationSettings = await this.prisma.notificationSettings.findFirst({
      where: {
        schoolId: school.id,
        tenantId,
      },
    });

    if (notificationSettings) {
      return this.prisma.notificationSettings.update({
        where: { id: notificationSettings.id },
        data: {
          ...data,
          schoolId: school.id,
          tenantId,
        },
      });
    } else {
      return this.prisma.notificationSettings.create({
        data: {
          ...data,
          schoolId: school.id,
          tenantId,
        },
      });
    }
  }

  // Complete onboarding
  async completeOnboarding(tenantId: string) {
    // Update school onboarding status
    const school = await this.prisma.school.findFirst({
      where: { tenantId },
    });

    if (school) {
      await this.prisma.school.update({
        where: { id: school.id },
        data: { onboardingCompleted: true },
      });
    }

    return { message: 'Onboarding completed successfully', tenantId };
  }

  // Get all onboarding data
  async getAllOnboardingData(tenantId: string) {
    const [
      school,
      branches,
      departments,
      employees,
      classes,
      subjects,
      students,
      parents,
      sessions,
      notifications,
    ] = await Promise.all([
      this.getSchoolDetails(tenantId),
      this.getBranches(tenantId),
      this.getDepartments(tenantId),
      this.getEmployees(tenantId),
      this.getClasses(tenantId),
      this.getSubjects(tenantId),
      this.getStudents(tenantId),
      this.getParents(tenantId),
      this.getSessions(tenantId),
      this.getNotifications(tenantId),
    ]);

    return {
      school,
      branches,
      departments,
      employees,
      classes,
      subjects,
      students,
      parents,
      sessions,
      notifications,
    };
  }
}