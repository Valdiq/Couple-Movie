package vladyslav.stasyshyn.couple_movie.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({ FIELD })
@Retention(RUNTIME)
@Constraint(validatedBy = UsernameValidator.class)
@Documented
public @interface ValidUsername {

    String message() default "Username must start with a letter, be at least 4 characters long, and contain no special characters";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
