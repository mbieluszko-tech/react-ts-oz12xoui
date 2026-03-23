export const PERMISSIONS = {
  member: {
    view_members: true,
    edit_members: false,
    add_members: false,
    delete_members: false,
    manage_sections: false,
    manage_org: false,
  },

  leader: {
    view_members: true,
    edit_members: true,   // tylko swojej sekcji (frontend ograniczy)
    add_members: false,
    delete_members: false,
    manage_sections: false,
    manage_org: false,
  },

  manager: {
    view_members: true,
    edit_members: true,
    add_members: true,
    delete_members: false,
    manage_sections: true,
    manage_org: false,
  },

  admin: {
    view_members: true,
    edit_members: true,
    add_members: true,
    delete_members: true,
    manage_sections: true,
    manage_org: true,
  },

  super_admin: {
    view_members: true,
    edit_members: true,
    add_members: true,
    delete_members: true,
    manage_sections: true,
    manage_org: true,
  }
};
