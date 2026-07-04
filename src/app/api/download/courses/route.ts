import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    
    // Fetch all folders, contents, and tests
    const allFolders = await db.collection('course_folders').find({}).toArray();
    const allContents = await db.collection('course_contents').find({}).toArray();
    const allTests = await db.collection('tests').find({}).toArray();

    const zip = new JSZip();

    // 1. Identify root courses (folders with parent_folder_id null or undefined, or parent_folder_id: "null")
    const rootCourses = allFolders.filter(
      (f: any) => !f.parent_folder_id || f.parent_folder_id === 'null' || f.parent_folder_id === null
    );

    // If no roots, treat all folders as flat or under a default Course folder
    const coursesToProcess = rootCourses.length > 0 ? rootCourses : [{ _id: 'all', title: 'General Courses' }];

    for (const course of coursesToProcess) {
      const courseFolder = zip.folder(course.title.replace(/[\/\\:*?"<>|]/g, '_'));
      if (!courseFolder) continue;

      const courseIdStr = course._id?.toString() || 'all';

      // 2. Find all subfolders of this course recursively
      const courseSubfolders = allFolders.filter(
        (f: any) => f.course_id === courseIdStr || String(f.parent_folder_id) === courseIdStr
      );

      // Create a map to resolve subfolders path
      const folderMap = new Map<string, any>();
      allFolders.forEach((f: any) => folderMap.set(f._id.toString(), f));

      // Add files in the root course folder
      const rootContents = allContents.filter((c: any) => String(c.folder_id) === courseIdStr);
      for (const content of rootContents) {
        const sanitizedTitle = content.title.replace(/[\/\\:*?"<>|]/g, '_');
        if (content.item_type === 'text' || content.content) {
          courseFolder.file(`${sanitizedTitle}.txt`, content.content || content.text_content || '');
        } else if (content.file_url) {
          courseFolder.file(
            `${sanitizedTitle}_link.txt`,
            `Title: ${content.title}\nType: ${content.item_type || 'Asset'}\nURL: ${content.file_url}\nSize: ${content.file_size || 'unknown'} bytes`
          );
        }
      }

      // Add subfolders and their contents
      for (const sub of courseSubfolders) {
        // Build path
        let pathParts: string[] = [];
        let current = sub;
        while (current && current._id.toString() !== courseIdStr) {
          pathParts.unshift(current.title.replace(/[\/\\:*?"<>|]/g, '_'));
          const parentId = current.parent_folder_id?.toString();
          current = parentId ? folderMap.get(parentId) : null;
        }
        
        const subPath = pathParts.join('/');
        const currentSubFolder = subPath ? courseFolder.folder(subPath) : courseFolder;
        if (!currentSubFolder) continue;

        // Add contents for this subfolder
        const subContents = allContents.filter((c: any) => String(c.folder_id) === sub._id.toString());
        for (const content of subContents) {
          const sanitizedTitle = content.title.replace(/[\/\\:*?"<>|]/g, '_');
          if (content.item_type === 'text' || content.content) {
            currentSubFolder.file(`${sanitizedTitle}.txt`, content.content || content.text_content || '');
          } else if (content.file_url) {
            currentSubFolder.file(
              `${sanitizedTitle}_link.txt`,
              `Title: ${content.title}\nType: ${content.item_type || 'Asset'}\nURL: ${content.file_url}\nSize: ${content.file_size || 'unknown'} bytes`
            );
          }
        }
      }

      // 3. Find and add test data associated with this course as CSV (Excel compatible)
      // Filter tests matching course_id or whose title is referenced in sitemaps/folders
      const courseTests = allTests.filter(
        (t: any) => String(t.course_id) === courseIdStr || t.course_title === course.title
      );

      if (courseTests.length > 0) {
        let csvLines = ['Test Title,Description,Time Limit (min),Pass Marks,Question ID,Question Text,Marks,Explanation,Correct Option,Options'];
        
        courseTests.forEach((t: any) => {
          const questions = t.questions || [];
          if (questions.length === 0) {
            csvLines.push(`"${t.title}","${t.description || ''}",${t.time_limit || 0},${t.pass_marks || 0},"N/A","No questions in this test",0,"","",""`);
          } else {
            questions.forEach((q: any) => {
              const optionsStr = (q.options || []).map((o: any) => `${o.id}: ${o.text}`).join(' | ');
              csvLines.push(
                `"${t.title}","${t.description || ''}",${t.time_limit || 0},${t.pass_marks || 0},"${q.id}","${q.text}",${q.marks || 1},"${q.explanation || ''}","${q.correctOptionId || ''}","${optionsStr}"`
              );
            });
          }
        });

        courseFolder.file('tests_and_assessments.csv', csvLines.join('\n'));
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="all_courses_export.zip"',
      },
    });

  } catch (error: any) {
    console.error('Failed to export courses ZIP:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
