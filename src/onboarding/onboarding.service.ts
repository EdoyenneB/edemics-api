// onboarding.service.ts (updated for your schema)
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

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
      },
    });
  }

// onboarding.service.ts - saveDepartments method
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

  // Create a map to track department IDs by name
  const departmentMap = new Map();
  
  // First pass: create all departments without parent references
  for (const dept of departments) {
    const { parentDepartment, branchId, ...deptData } = dept;
    
    // Find branch if branchId is provided
    let branch = null;
    if (branchId) {
      branch = await this.prisma.branch.findFirst({
        where: { 
          OR: [
            { id: branchId },
            { name: branchId }
          ],
          tenantId 
        },
      });
    }

    // Ensure classes are always academic
    const isAcademic = dept.type === "class" ? true : dept.isAcademic;

    const createdDept = await this.prisma.department.create({
      data: {
        ...deptData,
        isAcademic, // Force classes to be academic
        schoolId: school.id,
        tenantId,
        branchId: branch ? branch.id : null,
        parentDepartmentId: null, // Set to null initially
      },
    });
    
    // Store mapping using the original name as key
    departmentMap.set(dept.name, createdDept.id);
  }

  // Second pass: update parent-child relationships
  for (const dept of departments) {
    if (dept.parentDepartment && dept.parentDepartment !== "none") {
      const currentDeptId = departmentMap.get(dept.name);
      const parentId = departmentMap.get(dept.parentDepartment);
      
      if (parentId && currentDeptId) {
        await this.prisma.department.update({
          where: { id: currentDeptId },
          data: { parentDepartmentId: parentId },
        });
      }
    }
  }

  return this.getDepartments(tenantId);
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
      
      // Find related entities
      let departmentRecord = null;
      if (department && department !== "other") {
        departmentRecord = await this.prisma.department.findFirst({
          where: { 
            OR: [
              { id: department },
              { name: department }
            ],
            tenantId 
          },
        });
      }

      // Use custom department name if provided
      const finalDepartmentName = department === "other" ? customDepartment : department;

      let branchRecord = null;
      if (branch) {
        branchRecord = await this.prisma.branch.findFirst({
          where: { 
            OR: [
              { id: branch },
              { name: branch }
            ],
            tenantId 
          },
        });
      }

      let classRecord = null;
      if (classData) {
        classRecord = await this.prisma.class.findFirst({
          where: { 
            OR: [
              { id: classData },
              { name: classData }
            ],
            tenantId 
          },
        });
      }

      return this.prisma.employee.create({
        data: {
          ...empData,
          employeeId: employeeId || empData.id,
          departmentId: departmentRecord ? departmentRecord.id : null,
          branchId: branchRecord ? branchRecord.id : null,
          classId: classRecord ? classRecord.id : null,
          subDepartment: subDepartment === "other" ? customSubDepartment : subDepartment,
          customDepartment: department === "other" ? customDepartment : null,
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

async saveClasses(tenantId: string, classes: any[]) {
  // Delete existing classes and sections
  await this.prisma.section.deleteMany({
    where: { tenantId },
  });
  
  await this.prisma.class.deleteMany({
    where: { tenantId },
  });

  // Create new classes with sections
  const createdClasses = await Promise.all(
    classes.map(async (cls) => {
      const { sections, department, branch, ...classData } = cls;
      
      // Find related entities
      let departmentRecord = null;
      if (department) {
        departmentRecord = await this.prisma.department.findFirst({
          where: { 
            OR: [
              { id: department },
              { name: department }
            ],
            tenantId 
          },
        });
      }

      let branchRecord = null;
      if (branch) {
        branchRecord = await this.prisma.branch.findFirst({
          where: { 
            OR: [
              { id: branch },
              { name: branch }
            ],
            tenantId 
          },
        });
      }

      const createdClass = await this.prisma.class.create({
        data: {
          ...classData,
          department: departmentRecord ? departmentRecord.name : department,
          departmentId: departmentRecord ? departmentRecord.id : null,
          branchId: branchRecord ? branchRecord.id : null,
          tenantId,
        },
      });

      // Create sections
      if (sections && sections.length > 0) {
        await Promise.all(
          sections.map(async (section) => {
            const { teacher, assistantTeacher, customTeacher, customAssistantTeacher, ...sectionData } = section;
            
            // Use custom teacher names if provided
            const finalTeacher = teacher === "other" ? customTeacher : teacher;
            const finalAssistantTeacher = assistantTeacher === "other" ? customAssistantTeacher : assistantTeacher;

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
      }

      return this.prisma.class.findUnique({
        where: { id: createdClass.id },
        include: { sections: true },
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
        // Remove these properties that shouldn't be passed to Prisma
        
        ...cleanSubjectData // Keep only the properties that belong to Subject model
      } = subject;
      
      // Extract class ID or name string from object
      let classIdOrName: string | null = null;
      if (className) {
        if (typeof className === 'object') {
          // Extract just the ID or name string from the class object
          classIdOrName = className.id || className.name;
        } else {
          classIdOrName = className;
        }
      }
      
      // Extract section ID or name string from object  
      let sectionIdOrName: string | null = null;
      if (sectionName) {
        if (typeof sectionName === 'object') {
          // Extract just the ID or name string from the section object
          sectionIdOrName = sectionName.id || sectionName.name;
        } else {
          sectionIdOrName = sectionName;
        }
      }

      // Find class using just the string ID or name
      let classRecord = null;
      if (classIdOrName) {
        classRecord = await this.prisma.class.findFirst({
          where: { 
            OR: [
              { id: classIdOrName },  // ✅ Pass string ID
              { name: classIdOrName } // ✅ Pass string name
            ],
            tenantId 
          },
        });
      }

      // Find section using just the string ID or name
      let sectionRecord = null;
      if (sectionIdOrName && classRecord) {
        sectionRecord = await this.prisma.section.findFirst({
          where: { 
            OR: [
              { id: sectionIdOrName },  // ✅ Pass string ID
              { name: sectionIdOrName } // ✅ Pass string name
            ],
            classId: classRecord.id,
            tenantId 
          },
        });
      }

      // Use custom teacher names if provided
      const finalTeacher = cleanSubjectData.teacher === "other" ? customTeacher : cleanSubjectData.teacher;
      const finalAssistantTeacher = cleanSubjectData.assistantTeacher === "other" ? customAssistantTeacher : cleanSubjectData.assistantTeacher;

      return this.prisma.subject.create({
        data: {
          ...cleanSubjectData,
          teacher: finalTeacher,
          assistantTeacher: finalAssistantTeacher,
          customTeacher: cleanSubjectData.teacher === "other" ? customTeacher : null,
          customAssistantTeacher: cleanSubjectData.assistantTeacher === "other" ? customAssistantTeacher : null,
          classId: classRecord ? classRecord.id : null,
          sectionId: sectionRecord ? sectionRecord.id : null,
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

async saveStudentsAndParents(tenantId: string, data: { students: any[]; parents: any[] }) {
  const { students, parents } = data;
  
  try {
    // Delete existing students and parents
    await this.prisma.parentStudent.deleteMany({
      where: { tenantId },
    });
    
    await this.prisma.student.deleteMany({
      where: { tenantId },
    });
    
    await this.prisma.parent.deleteMany({
      where: { tenantId },
    });

    // First, create all students
    const studentMap = new Map();
    for (const student of students) {
      // Clean the student data - extract class name and convert to classId
      const { parents: _, class: className, section: sectionName, ...studentData } = student;
      
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

      const createdStudent = await this.prisma.student.create({
        data: {
          ...studentData,
          classId: classIdToUse, // Use the found classId or null
          sectionId: sectionIdToUse, // Use the found sectionId or null
          tenantId,
        },
        include: {
          class: true, // Include the class relation in the response
          section: true, // Include the section relation in the response
        },
      });
      studentMap.set(student.id || createdStudent.id, createdStudent);
    }

    // Then, create all parents
    const parentMap = new Map();
    for (const parent of parents) {
      // Clean the parent data
      const { students: studentIds, ...parentData } = parent;
      
      const createdParent = await this.prisma.parent.create({
        data: {
          ...parentData,
          tenantId,
        },
        include: {
          parentStudents: {
            include: {
              student: {
                include: {
                  class: true, // Include class in the response
                  section: true, // Include section in the response
                },
              },
            },
          },
        },
      });
      parentMap.set(parent.id || createdParent.id, createdParent);

      // Create parent-student relationships
      if (studentIds && studentIds.length > 0) {
        await Promise.all(
          studentIds.map(async (studentId: string) => {
            const student = studentMap.get(studentId);
            if (student) {
              await this.prisma.parentStudent.create({
                data: {
                  parentId: createdParent.id,
                  studentId: student.id,
                  tenantId,
                },
              });
            }
          })
        );
      }
    }

    return {
      students: Array.from(studentMap.values()),
      parents: Array.from(parentMap.values()),
    };
  } catch (error) {
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