package models;

/**
 * Created by wyu on 2/23/16.
 */

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import play.data.validation.*;
import play.db.ebean.Model;

import org.apache.commons.codec.binary.Base64;

import javax.persistence.*;

import play.db.ebean.*;

import com.avaje.ebean.*;

//import java.sql.Date;
import java.sql.Timestamp;
import java.util.*;

@Entity
@JsonIgnoreProperties({"networkFiles", "sharedNetworkFiles", "sharedRawDataFiles"})
public class User extends Model {
    @Id
    public long id;

    @Constraints.Required
    @Column(unique=true)
    public String userName;

    @Constraints.Required
    public String password;

    @Constraints.Required
    @Constraints.Email
    @Column(unique=true)
    public String email;

    @Constraints.Required
    public String firstName;

    @Constraints.Required
    public String lastName;

    @Constraints.Required
    public String title;

    @Constraints.Required
    public String organization;
    public Boolean isApproved = false;

    @Column(columnDefinition="TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    public Timestamp updateTime;

    @OneToMany(mappedBy="user")
    public List<NetworkFile> networkFiles = new ArrayList<NetworkFile>();

    @ManyToMany(mappedBy="modelSharedUsers")
    public List<NetworkFile> sharedNetworkFiles = new ArrayList<NetworkFile>();

    @ManyToMany(mappedBy="rawDataSharedUsers")
    public List<RawDataFile> sharedRawDataFiles = new ArrayList<RawDataFile>();

    public User() {}

    public User(String userName, String password, String email,
                String firstName, String lastName, String title,
                String organization) {

        this.userName = userName;
        this.password = passwordDecoded( password);
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.title = title;
        this.organization = organization;
    }

    public static String authenticate(String userName, String password) {
        User user = findByUserName(userName);
        if( user == null ) {
            return "userNotExist";
        } else if( user.isApproved ) {
            if( user.password.equals(passwordDecoded(password))) {
                return "match";
            } else {
                return "notMatch";
            }
        } else {
            return "notApproved";
        }
    }

    public static Finder<Long, User> find = new Finder<Long, User>(Long.class, User.class);

    public static User findByUserName ( String userName ) {
        return (User) find.where().eq("userName", userName).findUnique();
    }

    public static User findByEmail ( String email ) {
        return (User) find.where().eq("email", email).findUnique();
    }

    public static String passwordDecoded ( String password ) {
        byte[] byteArray = Base64.decodeBase64(password);
        String decodedPassword = new String(byteArray);
        return decodedPassword;
    }

    public static List<User> findAllApprovedList () {
        return (List<User>)find.where().eq("isApproved", true).findList();
    }

    public String toString() {
        return userName;
    }


}
