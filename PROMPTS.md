# Prompts

> [!CAUTION]
> All the prompts are laid out here as a one long text, without any separation between them.

> The framework was GitHub Copilot Spaces feature, using GPT-5 as the model.

# Weekly Scheduler

## Goal:

Build a PWA that allows users to plan their academic weekly schedule of a semester by choosing courses and assigning them to a weekly grid view.
The the primitive data structure for the schedule is a course object.
Each course object has several inner event categories, such as lectures, labs, and recitations.
A course event is related to exactly one category, and each category can have multiple events.
A course event can consist of multiple time slots, which can be on different days and hours.
In order to fully satisfy a course, all of its events must be scheduled.
Example:
Course Object Structure:

```js
{
  id: "895350",
  name: "Introduction to Communication Networks",
  events: [
    {
      id: "895350-01",
      category: "lecture",
      lecturers: ["Dr. Daniel Smith", "Prof. Jane Doe"],
      location: "Room 7, Building 507",
      timeSlots: [
        { day: "Monday", from: "16:00", to:"18:00" },
        { day: "Wednesday", from: "10:00", to:"12:00" },
      ]
    },
    {
      id: "895350-02",
      category: "lecture",
      lecturers: ["Dr. Daniel Smith", "Prof. Jane Doe"],
      location: "Room 7, Building 507",
      timeSlots: [
        { day: "Sunday", from: "08:00", to:"12:00" },
      ]
    },
    {
      id: "895350-03",
      category: "recitation",
      lecturers: ["Mr. John Doe"],
      location: "Room 103, Building 604",
      timeSlots: [
        { day: "Tuesday", from: "14:00", to:"16:00" },
      ]
    },
    {
      id: "895350-04",
      category: "recitation",
      lecturers: ["Dr. Alice Johnson"],
      location: "Room 205, Building 302",
      timeSlots: [
        { day: "Friday", from: "13:00", to:"15:00" },
      ]
    }
  ],
}
```

In this example, the course "Introduction to Communication Networks" has two lecture events and two recitation events, each with its own time slots and locations. A student may take only one lecture event and one recitation event for this course, but they can choose from the available options.

On startup, the user will provide a json file containing all the courses available for the semester (should be saved in local storage for future use).
The user can then select the courses they want to take, and the application will display on the weekly grid view all the events of the selected courses that can be scheduled (meaning events that do not overlap with already scheduled events, of a category that has not been scheduled yet elsewhere in the schedule).
The user can click on an unscheduled event to schedule it, and the application will update the weekly grid view accordingly.
The user can also click on a scheduled event to unschedule it.
The user can see a visual indication when a selected course is fully scheduled (all its events are scheduled) or partially scheduled (some of its events are scheduled, but not all).

### Weekly Grid View

This is the most dynamic part of the application.
It should take any available vertical space and most of the horizontal space (a small courses checkbox list on the side).
The y axis is the days of the week, and the x axis is the hours of the day - from minimum to maximum time slots available in the selected courses (default to 8:00 to 20:00).
In a given available time slot, all unscheduled events in that slot should be compactly displayed side by side, with a visual (color + index in selected courses list) indication of the course they belong to.
On hovering an unscheduled event, it should display the event details (category, lecturers, location, time slots).
On clicking an unscheduled event, it should be scheduled, and the grid view should update to show the event in the scheduled state (and now other unscheduled events in that time slot should be hidden, since that time slot is now taken).
When an event is scheduled, it should be displayed in the grid view with details (category, lecturers, location, time slots) and a visual indication of the course it belongs to.
On clicking a scheduled event, it should be unscheduled, and the grid view should update to show the event in the unscheduled state (and now other unscheduled events in that time slot should be displayed again).

## Technical Requirements:

- The application should be a Progressive Web App (PWA) to allow offline access and installation on devices.
- Use React, Zustand, Tailwind and Typescript for type safety and maintainability.
- The application is desktop-first, but should be responsive and work on various screen sizes.
- Use any other libraries to enhance the user experience and development process, as long as they are popular, well-maintained, and flexible enough to support the required features. Let me know if you do use any additional libraries.
- The application should have a clean and intuitive user interface for managing the schedule.
- Implement a local storage solution to save the schedule data, allowing users to access their schedules offline.
- The application is client-side only, so no server-side code is required.
- Make sure to design a modular and maintainable codebase, with clear separation of concerns.
- Make sensible decisions. But if there are fundamental issues or debates, please ask for clarification.

Please provide a full implementation.

Overall great work.
Some critial changes/improvements:

1. The axis in the weekly grid view should be reversed (days horizontally, hours vertically)
2. In the side courses list:
   a. selected courses should be at the top of the list.
   b. implement a simple search
3. The color of the courses:
   a. a colored should be assigned to a course only if it was selected (non selected courses has no color).
   b. make sure the color in the weekly grid and the courses list match.
4. In the weekly grid: when hovering on unscheduled event that includes several time slots - all its times slots should be expanded a bit to make a visual indication of the consequences of schedualing this event.

Great!
There seem to be some problem with the weekly grid layout, all the lines (hours) are squished in the top line.

Great!
Few more improvements to the weekly grid view:

1. Similar to a scheduled event, I want that unschduled events (that appear as options on the grid view) will have hight that spreads on the hours of its time slot. Note that it might be a little tricky, since we want to supprt cases where event A's time slot is completely inside event B's time slot (we don't want that B will visually cover and hide A)
2. The days, like the hours, should also (default to sunday-saturday but) be dynamically depend on the min day and max day there are courses on (but do not skip days in between)

Great.
More improvements:

1. In the grid view, I want a reversed visual design:
   a. an unscheduled event should be outlined and not filled background (like a scheduled event now)
   b. when hovering on uncheduled event or when an event is scheduled, it should have a filled background (like an uncheduled event now)
2. add some basic transformation animation when un/schedulating an event

Great, I think you just forgot to fill the background in the case of hover.
Currenly on hover there's invisible white text on the white background.

Great!
Few last fixes:

1. Unscheduled event (when hovered and when not hovered) should only contain the index of its course in the courses list. Also, to make it more intuitive, use uppercase english letters instead of numbers as indexes (meaning A, B, C, D, etc.).
2. There is a case when a course is not fully satisfied (not all categories are scheduled) but there are no avialbe events to schedule from this course (since time slots are occupied by other courses). Currently in the side bar it indicated the course is fully scheduled, while in this cases there should be a red indication that the course can't be fully scheduled in the current state.

Amazing work.
Now, we want to add a dark mode to the UI.
The mode should default to user OS prefernce, and add at the top bar a button to switch mode.
(the hours range selection at the top bar is not needed. you can remove it)

Great Job!
It seems that the theme mode just follows the OS theme preferences, and the mode button does not have any effect.

--- hidden prompt ---

Great!
There are some more needed changes now:

1. Our last task made me realize we forgot something. We actually do need a semester field to each time slot, and we need a top bar switch between the semesters. (According to the selected semester, events will appear on the weekly grid, while ignoring times slots of another semester and ignoring events that all their time slots are in another semester)
2. We want to support more UI languages, including Hebrew which is LTR language.
   a. Add a language picker to the top bar
   b. Make sure the language of all UI text is updated accordingly [if you know a popular library that would make the process easier, it might be usefull].
   c. When selecting a LTR language, all the UI needs to shift into LTR layout, meaning side bar to the right instead of left, days are arranged LTR instead of RTL in the weekly grid view etc. Make sure existing layout are being displayed correctly in both layouts.
3. The side bar should be collapsable.

Overall great job.
Some fixes:

1. As before, a scheduled event should show its details in its time slot in the weekly grid. Something in the last changes disabled this.
2. In Hebrew, the days of the week remains in RTL order, rather than LTR.
3. I think we would like to move the button that hides the side bar into the side bar itself.

You said: Great! 1. Make overall refactoring to the codebase,
Great!

1. Make overall refactoring to the codebase, now that it is more mature. Try to logically divide things into separate files and modularize/merge recurring things.
2. The side bar show/hide should have some transition animation.
3. --- hidden prompt ---

Great job overall.

1. Please fix back that after event is scheduled it should spread vertically in its entire time slot (according to its hours).
2. When collapsed, the button to expand the collapsed side bar is a bit too sqoushed. please fix this so that it will have enought width.
3. In English (LTR) the semster, language and theme pickers stick to the end (right) of the top bar. Please make that also in Hebrew (RTL) those pickers would stick to the end of the top bar, which in this case is to the left.
4. Also, delete the "Load Sample" buttron in the top bar. it is not usefull.

Great. Some UI imporovements regarding side bar:

1. Make sure it supports a long list of courses, meaning that there needs to be some scrolling metchanics when relevant.
2. Move the collapse/expand side bar button into the start of the top bar. When collapsed, it should completely dissappear, leaving all the room for the weekly grid view.
