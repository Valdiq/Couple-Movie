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
@Constraint(validatedBy = NameValidator.class)
@Documented
public @interface ValidName {

    String message() default "Name must contain only letters";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
