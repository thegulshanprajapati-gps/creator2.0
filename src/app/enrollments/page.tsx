'use client';

import { useEffect, useState, useMemo } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db';
import { 
  Users, GraduationCap, Search, RefreshCw, BookOpen, UserCheck, Plus, CheckSquare, 
  Trash2, ShieldAlert, History, Undo, Check, AlertCircle, Calendar, ChevronDown, ChevronUp, Bell 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StudentProfile {
  id: string;
  email: string;
  name: string;
  enrolledCourses: string[];
  enrolledTests: string[];
  createdAt: string;
}

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  studentsCount: number;
}

interface TestItem {
  id: string;
  title: string;
}

interface AuditLog {
  id?: string;
  actor_id: string;
  actor_name: string;
  role: string;
  action_type: string;
  student_id: string;
  student_name: string;
  course_changes: { added: string[]; removed: string[] };
  test_changes: { added: string[]; removed: string[] };
  before_state: { courses: string[]; tests: string[] };
  after_state: { courses: string[]; tests: string[] };
  timestamp: string;
  ip_address: string;
  browser_info: string;
  domain: string;
}

export default function SupportEnrollmentsPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('all'); // all, enrolled, unenrolled, recent
  
  // RBAC permissions state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [permissions, setPermissions] = useState({
    canEnroll: true,
    canUnenroll: true,
    canBulkEnroll: true
  });

  // Table selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [expandedBadges, setExpandedBadges] = useState<Record<string, boolean>>({});

  // Single/Bulk Dialog States
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [dialogStudentId, setDialogStudentId] = useState('');
  const [dialogCourses, setDialogCourses] = useState<string[]>([]);
  const [dialogTests, setDialogTests] = useState<string[]>([]);
  const [savingEnrollments, setSavingEnrollments] = useState(false);

  // Bulk Dialog States
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkCourses, setBulkCourses] = useState<string[]>([]);
  const [bulkTests, setBulkTests] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState<'assign' | 'remove'>('assign');

  // History States
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<StudentProfile | null>(null);
  const [studentHistoryLogs, setStudentHistoryLogs] = useState<AuditLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Undo Stack State
  const [lastAction, setLastAction] = useState<{
    type: 'single' | 'bulk';
    beforeState: Array<{ studentId: string; courses: string[]; tests: string[] }>;
    timestamp: number;
  } | null>(null);
  const [showUndoBanner, setShowUndoBanner] = useState(false);

  // Debounce search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Actor Profile & RBAC Permissions
  const fetchActor = async () => {
    try {
      const { data: { user } } = await db.auth.getUser();
      if (user) {
        const { data: profile } = await db.from('profiles').select('*').eq('email', user.email).single();
        const role = profile?.role || 'super_admin';
        setCurrentUser({ ...user, ...profile, role });

        // Enforce role permission matrix - support admin always has full access
        setPermissions({ canEnroll: true, canUnenroll: true, canBulkEnroll: true });
      }
    } catch (e) {
      console.error('Error fetching actor permissions:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch courses
      const { data: coursesData, error: coursesError } = await db
        .from('course_folders')
        .select('id, title, slug, students, parent_folder_id, course_id')
        .order('title', { ascending: true });

      if (coursesError) throw new Error(coursesError.message);

      // 2. Fetch tests
      const { data: testsData, error: testsError } = await db
        .from('tests')
        .select('id, title')
        .order('title', { ascending: true });

      // 3. Fetch assessments folders
      const { data: assessmentsFolders, error: assessmentsError } = await db
        .from('course_folders')
        .match({ course_id: 'assessments' });

      // 4. Fetch student profiles
      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('*');

      if (profilesError) throw new Error(profilesError.message);

      // Normalize courses (Only root curriculum course folders, exclude subfolders, assessments folders, and trash folders)
      const trashTitles = ['.thumbnail', 'thumbnail', 'content', 'Content'];
      const normalizedCourses: CourseItem[] = (coursesData || [])
        .filter((c: any) => {
          const isRoot = !c.parent_folder_id || c.parent_folder_id === '' || c.parent_folder_id === 'null';
          const isNotAssessment = c.course_id !== 'assessments';
          const isNotTrash = c.title && !trashTitles.includes(c.title);
          return isRoot && isNotAssessment && isNotTrash;
        })
        .map((c: any) => ({
          id: c.id,
          title: c.title || 'Untitled Course',
          slug: c.slug || '',
          studentsCount: 0
        }));

      // Normalize tests
      const normalizedTests: TestItem[] = (testsData || []).map((t: any) => ({
        id: t.id,
        title: t.title || 'Untitled Test'
      }));

      // Normalize students
      const studentProfiles: StudentProfile[] = (profilesData || [])
        .filter((p: any) => p.role === 'student' || !p.role || p.role === '')
        .map((p: any) => {
          const enrolled = Array.isArray(p.enrolled_courses) ? p.enrolled_courses : [];
          
          // Increment dynamic counts for courses
          enrolled.forEach((courseId: string) => {
            const match = normalizedCourses.find(nc => nc.id === courseId || nc.slug === courseId);
            if (match) match.studentsCount += 1;
          });

          // Resolve tests
          const enrolledTestsList = Array.isArray(p.enrolled_tests) ? [...p.enrolled_tests] : [];
          const studentFolder = (assessmentsFolders || []).find((f: any) => f.metadata?.student_id === p.id);
          if (studentFolder) {
            const children = (assessmentsFolders || []).filter((f: any) => String(f.parent_folder_id) === String(studentFolder.id));
            children.forEach((c: any) => {
              if (c.title && !enrolledTestsList.includes(c.title)) {
                enrolledTestsList.push(c.title);
              }
            });
          }

          return {
            id: p.id,
            email: p.email || 'No email',
            name: p.full_name || p.name || 'Anonymous',
            enrolledCourses: enrolled,
            enrolledTests: enrolledTestsList,
            createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Unknown'
          };
        });

      setCourses(normalizedCourses);
      setTests(normalizedTests);
      setStudents(studentProfiles);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Data Fetch Failed', description: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActor();
    fetchData();
  }, []);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch = 
        student.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.enrolledCourses.some(c => c.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        student.enrolledTests.some(t => t.toLowerCase().includes(debouncedSearch.toLowerCase()));

      const matchCourse = 
        selectedCourseFilter === 'all' || 
        student.enrolledCourses.includes(selectedCourseFilter);

      let matchStatus = true;
      if (enrollmentStatusFilter === 'enrolled') {
        matchStatus = student.enrolledCourses.length > 0 || student.enrolledTests.length > 0;
      } else if (enrollmentStatusFilter === 'unenrolled') {
        matchStatus = student.enrolledCourses.length === 0 && student.enrolledTests.length === 0;
      } else if (enrollmentStatusFilter === 'recent') {
        const joinedDate = new Date(student.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        matchStatus = joinedDate >= sevenDaysAgo;
      }

      return matchSearch && matchCourse && matchStatus;
    });
  }, [students, debouncedSearch, selectedCourseFilter, enrollmentStatusFilter]);

  // Audit Logger Helper
  const logEnrollmentChange = async (
    actionType: string,
    student: StudentProfile,
    before: { courses: string[]; tests: string[] },
    after: { courses: string[]; tests: string[] }
  ) => {
    const courseAdded = after.courses.filter(c => !before.courses.includes(c));
    const courseRemoved = before.courses.filter(c => !after.courses.includes(c));
    const testAdded = after.tests.filter(t => !before.tests.includes(t));
    const testRemoved = before.tests.filter(t => !after.tests.includes(t));

    const auditLog: AuditLog = {
      actor_id: currentUser?.id || 'system',
      actor_name: currentUser?.full_name || currentUser?.name || 'Administrator',
      role: currentUser?.role || 'super_admin',
      action_type: actionType,
      student_id: student.id,
      student_name: student.name,
      course_changes: { added: courseAdded, removed: courseRemoved },
      test_changes: { added: testAdded, removed: testRemoved },
      before_state: before,
      after_state: after,
      timestamp: new Date().toISOString(),
      ip_address: '127.0.0.1',
      browser_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      domain: 'supportdomain'
    };

    await db.from('audit_logs').insert(auditLog);
  };

  // Sync test folder structures to course_folders
  const syncStudentTestFolders = async (studentId: string, studentName: string, targetTests: string[]) => {
    const { data: currentFolders } = await db.from('course_folders').match({ course_id: 'assessments' });

    let studentFolder = (currentFolders || []).find((f: any) => f.metadata?.student_id === studentId);
    if (!studentFolder) {
      const newFolderId = 'assess-folder-' + Math.random().toString(36).substring(2, 11);
      const { data } = await db.from('course_folders').insert({
        id: newFolderId,
        title: studentName,
        slug: 'assessments-' + studentId,
        course_id: 'assessments',
        parent_folder_id: null,
        metadata: { student_id: studentId }
      }).select().single();
      studentFolder = data || { id: newFolderId };
    }

    const currentSubfolders = (currentFolders || []).filter((f: any) => String(f.parent_folder_id) === String(studentFolder.id));

    // Create subfolders for tests
    for (const testId of targetTests) {
      if (!currentSubfolders.some((f: any) => f.title === testId)) {
        await db.from('course_folders').insert({
          id: 'assess-sub-' + Math.random().toString(36).substring(2, 11),
          title: testId,
          slug: 'assessment-' + studentId + '-' + testId,
          course_id: 'assessments',
          parent_folder_id: studentFolder.id,
          metadata: { test_id: testId }
        });
      }
    }

    // Remove subfolders
    for (const folder of currentSubfolders) {
      if (!targetTests.includes(folder.title)) {
        await db.from('course_folders').delete().eq('id', folder.id);
      }
    }
  };

  // Smart Validation Engine
  const validateEnrollment = (
    student: StudentProfile,
    targetCourses: string[],
    targetTests: string[]
  ): { isValid: boolean; messages: string[] } => {
    const messages: string[] = [];

    // Check course existence & duplicates
    targetCourses.forEach(cid => {
      const courseExists = courses.some(c => c.id === cid || c.slug === cid);
      if (!courseExists) {
        messages.push(`Course ID "${cid}" does not exist in DB.`);
      }
      if (student.enrolledCourses.includes(cid)) {
        messages.push(`Already enrolled in course: ${courses.find(c => c.id === cid)?.title || cid} - skipped.`);
      }
    });

    // Check test existence & duplicates
    targetTests.forEach(tid => {
      const testExists = tests.some(t => t.id === tid);
      if (!testExists) {
        messages.push(`Test ID "${tid}" does not exist in DB.`);
      }
      if (student.enrolledTests.includes(tid)) {
        messages.push(`Already assigned test: ${tests.find(t => t.id === tid)?.title || tid} - skipped.`);
      }
    });

    return {
      isValid: messages.length === 0,
      messages
    };
  };

  // Save Single Enrollments
  const saveSingleEnrollments = async () => {
    if (!dialogStudentId) return;

    const targetStudent = students.find(s => s.id === dialogStudentId);
    if (!targetStudent) return;

    setSavingEnrollments(true);
    try {
      const beforeState = { courses: targetStudent.enrolledCourses, tests: targetStudent.enrolledTests };
      const validation = validateEnrollment(targetStudent, dialogCourses.filter(c => !beforeState.courses.includes(c)), dialogTests.filter(t => !beforeState.tests.includes(t)));

      // Save previous state for undo capability
      setLastAction({
        type: 'single',
        beforeState: [{ studentId: dialogStudentId, courses: beforeState.courses, tests: beforeState.tests }],
        timestamp: Date.now()
      });

      // Update profiles
      const { error: profileError } = await db
        .from('profiles')
        .update({
          enrolled_courses: dialogCourses,
          enrolled_tests: dialogTests
        })
        .eq('id', dialogStudentId);

      if (profileError) throw new Error(profileError.message);

      // Sync folders
      await syncStudentTestFolders(dialogStudentId, targetStudent.name, dialogTests);

      // Audit log
      await logEnrollmentChange('enrolled', targetStudent, beforeState, { courses: dialogCourses, tests: dialogTests });

      if (validation.messages.length > 0) {
        toast({
          title: 'Enrollment updated (with notices)',
          description: validation.messages.join(' | ')
        });
      } else {
        toast({ title: 'Success', description: 'Enrollments updated successfully!' });
      }

      setIsEnrollDialogOpen(false);
      setShowUndoBanner(true);
      setTimeout(() => setShowUndoBanner(false), 9000);
      await fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message || String(err) });
    } finally {
      setSavingEnrollments(false);
    }
  };

  // Save Bulk Enrollments
  const saveBulkEnrollments = async () => {
    if (selectedStudentIds.length === 0) return;

    setSavingEnrollments(true);
    try {
      const beforeStates: Array<{ studentId: string; courses: string[]; tests: string[] }> = [];

      for (const studentId of selectedStudentIds) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;

        const beforeState = { courses: student.enrolledCourses, tests: student.enrolledTests };
        beforeStates.push({ studentId, courses: beforeState.courses, tests: beforeState.tests });

        let nextCourses = [...student.enrolledCourses];
        let nextTests = [...student.enrolledTests];

        if (bulkActionType === 'assign') {
          bulkCourses.forEach(c => {
            if (!nextCourses.includes(c)) nextCourses.push(c);
          });
          bulkTests.forEach(t => {
            if (!nextTests.includes(t)) nextTests.push(t);
          });
        } else {
          nextCourses = nextCourses.filter(c => !bulkCourses.includes(c));
          nextTests = nextTests.filter(t => !bulkTests.includes(t));
        }

        // Update profile
        await db.from('profiles').update({ enrolled_courses: nextCourses, enrolled_tests: nextTests }).eq('id', studentId);

        // Sync folders
        await syncStudentTestFolders(studentId, student.name, nextTests);

        // Audit Logging
        await logEnrollmentChange(
          bulkActionType === 'assign' ? 'bulk_enrolled' : 'course_removed',
          student,
          beforeState,
          { courses: nextCourses, tests: nextTests }
        );
      }

      setLastAction({
        type: 'bulk',
        beforeState: beforeStates,
        timestamp: Date.now()
      });

      toast({ title: 'Success', description: `Bulk action applied to ${selectedStudentIds.length} students.` });
      setIsBulkDialogOpen(false);
      setSelectedStudentIds([]);
      setShowUndoBanner(true);
      setTimeout(() => setShowUndoBanner(false), 9000);
      await fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Bulk Operation Failed', description: err.message || String(err) });
    } finally {
      setSavingEnrollments(false);
    }
  };

  // Undo Last Action
  const triggerUndo = async () => {
    if (!lastAction) return;

    setSavingEnrollments(true);
    try {
      for (const item of lastAction.beforeState) {
        const student = students.find(s => s.id === item.studentId);
        if (!student) continue;

        // Restore profiles state
        await db.from('profiles').update({
          enrolled_courses: item.courses,
          enrolled_tests: item.tests
        }).eq('id', item.studentId);

        // Sync folders
        await syncStudentTestFolders(item.studentId, student.name, item.tests);

        // Log the Undo action in Audit Trail
        await logEnrollmentChange(
          'undo_trigger',
          student,
          { courses: student.enrolledCourses, tests: student.enrolledTests },
          { courses: item.courses, tests: item.tests }
        );
      }

      toast({ title: 'Undo Successful', description: 'The previous enrollment change has been reverted.' });
      setLastAction(null);
      setShowUndoBanner(false);
      await fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Undo Failed', description: err.message || String(err) });
    } finally {
      setSavingEnrollments(false);
    }
  };

  // Open History Dialog
  const openHistoryDialog = async (student: StudentProfile) => {
    setHistoryStudent(student);
    setIsHistoryDialogOpen(true);
    setLoadingHistory(true);
    try {
      const { data, error } = await db
        .from('audit_logs')
        .match({ student_id: student.id })
        .order('timestamp', { ascending: false });

      if (error) throw new Error(error.message);
      setStudentHistoryLogs(data || []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to fetch history logs', description: e.message || String(e) });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open single enrollment edit
  const openSingleEnroll = (studentId: string) => {
    setDialogStudentId(studentId);
    const target = students.find(s => s.id === studentId);
    if (target) {
      setDialogCourses(target.enrolledCourses);
      setDialogTests(target.enrolledTests);
    }
    setIsEnrollDialogOpen(true);
  };

  // Checkbox selection helpers
  const handleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleBadgeExpand = (studentId: string) => {
    setExpandedBadges(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleDialogStudentChange = (id: string) => {
    setDialogStudentId(id);
    const target = students.find(s => s.id === id);
    if (target) {
      setDialogCourses(target.enrolledCourses);
      setDialogTests(target.enrolledTests);
    } else {
      setDialogCourses([]);
      setDialogTests([]);
    }
  };

  const toggleDialogCourse = (courseId: string) => {
    setDialogCourses(prev =>
      prev.includes(courseId) ? prev.filter(c => c !== courseId) : [...prev, courseId]
    );
  };

  const toggleDialogTest = (testId: string) => {
    setDialogTests(prev =>
      prev.includes(testId) ? prev.filter(t => t !== testId) : [...prev, testId]
    );
  };

  // Dynamic stats computations for cards
  const totalStudents = students.length;
  const newStudentsCount = students.filter(s => {
    const joined = s.createdAt && s.createdAt !== 'Unknown' ? new Date(s.createdAt) : new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() - 30);
    return joined >= limit;
  }).length;
  const studentGrowthPercent = totalStudents > 0
    ? ((newStudentsCount / totalStudents) * 100).toFixed(1)
    : '0';

  const newStudentsWeekly = students.filter(s => {
    const joined = s.createdAt && s.createdAt !== 'Unknown' ? new Date(s.createdAt) : new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() - 7);
    return joined >= limit;
  }).length;

  const totalEnrollments = students.reduce((acc, curr) => acc + curr.enrolledCourses.length, 0);
  const activePercent = totalStudents > 0
    ? ((students.filter(s => s.enrolledCourses.length > 0).length / totalStudents) * 100).toFixed(1)
    : '0';

  const totalTestsAllotted = students.reduce((acc, curr) => acc + curr.enrolledTests.length, 0);
  const isOptimal = totalTestsAllotted >= totalStudents && totalStudents > 0;

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10 pb-20 relative">
        
        {/* Undo Banner Alert */}
        {showUndoBanner && lastAction && (
          <div className="sticky top-0 z-50 bg-indigo-600 text-white font-bold px-6 py-3 flex items-center justify-between shadow-md transition-all duration-300 animate-in fade-in-50">
            <div className="flex items-center gap-2 text-sm">
              <Undo className="h-4 w-4" />
              <span>Enrollment updated. Want to revert this action?</span>
            </div>
            <Button size="sm" variant="outline" className="border-white bg-white/10 hover:bg-white/20 text-white font-extrabold" onClick={triggerUndo}>
              Undo Action
            </Button>
          </div>
        )}

        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 border-indigo-200/40 dark:border-indigo-500/10">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-bold text-xl text-indigo-900 dark:text-indigo-400">Student Enrollments</h1>
            <p className="text-xs text-muted-foreground">Support Panel: Admin access to bulk enrollments, timelines, and audit logs.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={() => {
              setDialogStudentId('');
              setDialogCourses([]);
              setDialogTests([]);
              setIsEnrollDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" /> Enroll Student
            </Button>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Summary Cards */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-3xl border border-border shadow-sm bg-background">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Total Students</CardTitle>
                <Users className="h-5 w-5 text-indigo-500" />
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="text-3xl font-extrabold text-foreground">{totalStudents}</div>
                <div className="flex items-center">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <i className="fa-solid fa-arrow-trend-up"></i> +{studentGrowthPercent}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border shadow-sm bg-background">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">New Students</CardTitle>
                <BookOpen className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="text-3xl font-extrabold text-foreground">{newStudentsWeekly}</div>
                <div className="flex items-center">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <i className="fa-solid fa-arrow-trend-up"></i> +{newStudentsWeekly} NEW
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border shadow-sm bg-background">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Active Enrollments</CardTitle>
                <GraduationCap className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="text-3xl font-extrabold text-emerald-600">{totalEnrollments}</div>
                <div className="flex items-center">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <i className="fa-solid fa-arrow-trend-up"></i> +{activePercent}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border shadow-sm bg-background">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Tests Allotted</CardTitle>
                <Bell className="h-5 w-5 text-violet-500" />
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="text-3xl font-extrabold text-violet-600">{totalTestsAllotted}</div>
                <div className="flex items-center">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <i className="fa-solid fa-circle-check"></i> {isOptimal ? 'OPTIMAL' : 'STABLE'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtering and Controls Card */}
          <Card className="rounded-[2rem] border border-border shadow-sm overflow-hidden bg-background">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-6 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Search Directory</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search student, email, courses, or tests..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="w-full md:col-span-3 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Filter by Course</label>
                  <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title} ({course.studentsCount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:col-span-3 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Enrollment State</label>
                  <Select value={enrollmentStatusFilter} onValueChange={setEnrollmentStatusFilter}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="All Profiles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Profiles</SelectItem>
                      <SelectItem value="enrolled">Active Enrollments</SelectItem>
                      <SelectItem value="unenrolled">Unenrolled Profiles</SelectItem>
                      <SelectItem value="recent">Enrolled Recently (7 Days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Directory Table Card */}
          <Card className="rounded-[2rem] border border-border overflow-hidden bg-background">
            <CardHeader className="bg-primary/[0.02] border-b pb-4 flex flex-row justify-between items-center">
              <div>
                <CardTitle>Enrollment Directory</CardTitle>
                <CardDescription>Live student registrations with real-time course/test matrices.</CardDescription>
              </div>
              {selectedStudentIds.length > 0 && (
                <Badge className="bg-indigo-500/10 text-indigo-800 border-indigo-500/30 text-xs font-bold py-1 px-3">
                  {selectedStudentIds.length} Selected
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 pl-6">
                        <Checkbox 
                          checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                          onCheckedChange={handleSelectAllStudents}
                        />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Enrolled Courses</TableHead>
                      <TableHead>Enrolled Tests</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead className="pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <TableRow key={i} className="animate-pulse">
                          <TableCell colSpan={7} className="h-14 py-4"></TableCell>
                        </TableRow>
                      ))
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.map(student => {
                        const isExpanded = expandedBadges[student.id] || false;
                        
                        const shownCourses = isExpanded ? student.enrolledCourses : student.enrolledCourses.slice(0, 3);
                        const hiddenCoursesCount = student.enrolledCourses.length - shownCourses.length;

                        const shownTests = isExpanded ? student.enrolledTests : student.enrolledTests.slice(0, 3);
                        const hiddenTestsCount = student.enrolledTests.length - shownTests.length;

                        return (
                          <TableRow key={student.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="pl-6">
                              <Checkbox 
                                checked={selectedStudentIds.includes(student.id)}
                                onCheckedChange={() => handleSelectStudent(student.id)}
                              />
                            </TableCell>
                            <TableCell className="font-bold text-slate-800 dark:text-white py-4 flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-indigo-500" /> {student.name}
                            </TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell className="max-w-xs">
                              <div className="flex flex-wrap gap-1.5">
                                {shownCourses.length > 0 ? (
                                  shownCourses.map(courseId => {
                                    const course = courses.find(c => c.id === courseId || c.slug === courseId);
                                    return (
                                      <Badge key={courseId} variant="outline" className="bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/10 rounded-md font-semibold text-[10px]">
                                        {course ? course.title : courseId}
                                      </Badge>
                                    );
                                  })
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">No Active Courses</span>
                                )}
                                {hiddenCoursesCount > 0 && (
                                  <Badge variant="outline" className="cursor-pointer bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 text-[10px]" onClick={() => toggleBadgeExpand(student.id)}>
                                    +{hiddenCoursesCount} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="flex flex-wrap gap-1.5">
                                {shownTests.length > 0 ? (
                                  shownTests.map(testId => {
                                    const test = tests.find(t => t.id === testId);
                                    return (
                                      <Badge key={testId} variant="outline" className="bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/10 rounded-md font-semibold text-[10px]">
                                        {test ? test.title : testId}
                                      </Badge>
                                    );
                                  })
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">No Active Tests</span>
                                )}
                                {hiddenTestsCount > 0 && (
                                  <Badge variant="outline" className="cursor-pointer bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 text-[10px]" onClick={() => toggleBadgeExpand(student.id)}>
                                    +{hiddenTestsCount} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{student.createdAt}</TableCell>
                            <TableCell className="pr-6 text-right space-x-1.5">
                              <Button size="sm" variant="outline" className="h-8 font-bold text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50" onClick={() => openSingleEnroll(student.id)}>
                                Manage
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 font-bold text-xs text-slate-500 border-indigo-200 hover:bg-indigo-50" onClick={() => openHistoryDialog(student)}>
                                <History className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-medium">
                          No enrollments found matching the search criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Sticky Action Footer for Bulk Operations */}
        {selectedStudentIds.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 shadow-xl flex items-center justify-between gap-4">
              <span className="text-xs font-bold">
                {selectedStudentIds.length} students selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={() => {
                  setBulkActionType('assign');
                  setBulkCourses([]);
                  setBulkTests([]);
                  setIsBulkDialogOpen(true);
                }}>
                  Bulk Assign
                </Button>
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={() => {
                  setBulkActionType('remove');
                  setBulkCourses([]);
                  setBulkTests([]);
                  setIsBulkDialogOpen(true);
                }}>
                  Bulk Unallot
                </Button>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setSelectedStudentIds([])}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Single Student Dialog */}
        <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline font-bold text-xl text-indigo-900 dark:text-indigo-400">Manage Enrollments</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Assign courses and assessment tests to the selected student profile.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Student Profile</Label>
                {dialogStudentId ? (
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                    <span className="font-bold text-sm text-foreground">
                      {students.find(s => s.id === dialogStudentId)?.name || 'Select a student'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {students.find(s => s.id === dialogStudentId)?.email}
                    </span>
                  </div>
                ) : (
                  <Select value={dialogStudentId} onValueChange={handleDialogStudentChange}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Choose student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Courses Checklist */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Allot Courses</Label>
                <div className="max-h-36 overflow-y-auto border rounded-xl p-3 space-y-2.5 bg-background">
                  {courses.length > 0 ? (
                    courses.map(course => (
                      <div key={course.id} className="flex items-center space-x-2.5">
                        <Checkbox 
                          id={`c-${course.id}`} 
                          checked={dialogCourses.includes(course.id)} 
                          onCheckedChange={() => toggleDialogCourse(course.id)} 
                        />
                        <label htmlFor={`c-${course.id}`} className="text-xs font-bold text-foreground cursor-pointer select-none leading-none">
                          {course.title}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-1">No courses found.</p>
                  )}
                </div>
              </div>

              {/* Tests Checklist */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Allot Assessments / Tests</Label>
                <div className="max-h-36 overflow-y-auto border rounded-xl p-3 space-y-2.5 bg-background">
                  {tests.length > 0 ? (
                    tests.map(test => (
                      <div key={test.id} className="flex items-center space-x-2.5">
                        <Checkbox 
                          id={`t-${test.id}`} 
                          checked={dialogTests.includes(test.id)} 
                          onCheckedChange={() => toggleDialogTest(test.id)} 
                        />
                        <label htmlFor={`t-${test.id}`} className="text-xs font-bold text-foreground cursor-pointer select-none leading-none">
                          {test.title}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-1">No tests found.</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl font-bold h-11" onClick={() => setIsEnrollDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold h-11" onClick={saveSingleEnrollments} disabled={savingEnrollments}>
                {savingEnrollments ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Operation Dialog */}
        <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline font-bold text-xl text-indigo-900 dark:text-indigo-400">
                {bulkActionType === 'assign' ? 'Bulk Allot Enrollments' : 'Bulk Unallot Enrollments'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Apply courses and assessments to {selectedStudentIds.length} selected students. Duplicate enrollments will be skipped automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Courses Checklist */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Courses</Label>
                <div className="max-h-36 overflow-y-auto border rounded-xl p-3 space-y-2.5 bg-background">
                  {courses.map(course => (
                    <div key={course.id} className="flex items-center space-x-2.5">
                      <Checkbox 
                        id={`bc-${course.id}`} 
                        checked={bulkCourses.includes(course.id)} 
                        onCheckedChange={() => setBulkCourses(prev =>
                          prev.includes(course.id) ? prev.filter(c => c !== course.id) : [...prev, course.id]
                        )} 
                      />
                      <label htmlFor={`bc-${course.id}`} className="text-xs font-bold text-foreground cursor-pointer select-none leading-none">
                        {course.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tests Checklist */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assessments / Tests</Label>
                <div className="max-h-36 overflow-y-auto border rounded-xl p-3 space-y-2.5 bg-background">
                  {tests.map(test => (
                    <div key={test.id} className="flex items-center space-x-2.5">
                      <Checkbox 
                        id={`bt-${test.id}`} 
                        checked={bulkTests.includes(test.id)} 
                        onCheckedChange={() => setBulkTests(prev =>
                          prev.includes(test.id) ? prev.filter(t => t !== test.id) : [...prev, test.id]
                        )} 
                      />
                      <label htmlFor={`bt-${test.id}`} className="text-xs font-bold text-foreground cursor-pointer select-none leading-none">
                        {test.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl font-bold h-11" onClick={() => setIsBulkDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold h-11" onClick={saveBulkEnrollments} disabled={savingEnrollments}>
                {savingEnrollments ? 'Applying...' : 'Confirm Action'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline font-bold text-xl text-indigo-900 dark:text-indigo-400">Enrollment Log Audit Timeline</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                History of state transitions for student {historyStudent?.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 max-h-96 overflow-y-auto space-y-4 pr-1">
              {loadingHistory ? (
                <div className="text-center py-6 text-xs text-muted-foreground">Loading log entries...</div>
              ) : studentHistoryLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">No audits recorded for this student profile yet.</div>
              ) : (
                <div className="space-y-4 border-l border-indigo-200 dark:border-indigo-950/40 ml-3 pl-4">
                  {studentHistoryLogs.map((log, idx) => {
                    const dateFormatted = new Date(log.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={idx} className="relative space-y-1">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex justify-between">
                          <span>{dateFormatted}</span>
                          <span className="text-indigo-700 dark:text-indigo-400 font-extrabold uppercase">
                            {log.action_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-foreground">
                          By: {log.actor_name} ({log.role.toUpperCase()})
                        </p>
                        
                        <div className="text-[11px] bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border space-y-1">
                          {log.course_changes.added.length > 0 && (
                            <div className="text-emerald-600 dark:text-emerald-400">
                              + Course: {log.course_changes.added.map(c => courses.find(cr => cr.id === c)?.title || c).join(', ')}
                            </div>
                          )}
                          {log.course_changes.removed.length > 0 && (
                            <div className="text-rose-600 dark:text-rose-400">
                              - Course: {log.course_changes.removed.map(c => courses.find(cr => cr.id === c)?.title || c).join(', ')}
                            </div>
                          )}
                          {log.test_changes.added.length > 0 && (
                            <div className="text-emerald-600 dark:text-emerald-400">
                              + Test: {log.test_changes.added.map(t => tests.find(ts => ts.id === t)?.title || t).join(', ')}
                            </div>
                          )}
                          {log.test_changes.removed.length > 0 && (
                            <div className="text-rose-600 dark:text-rose-400">
                              - Test: {log.test_changes.removed.map(t => tests.find(ts => ts.id === t)?.title || t).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button className="rounded-xl font-bold h-11" onClick={() => setIsHistoryDialogOpen(false)}>
                Close History
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </SidebarInset>
    </SidebarProvider>
  );
}
